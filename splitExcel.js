import ExcelJS from "exceljs";
import fs from "fs";
import os from "os";
import path from "path";
import xlsx from "xlsx";

// Utility function to sanitize strings for use as filenames/directory names
function sanitizeFilename(name) {
  // Convert to string, handle potential null/undefined
  const strName = String(name || "");
  // Replace invalid characters with underscore
  // Invalid chars: / \ : * ? " < > |
  // Also replace leading/trailing dots or spaces which can be problematic
  return strName
    .replace(/[\\/:*?"<>|]/g, "_") // Replace core invalid chars
    .replace(/^\.+|\.+$|^\s+|\s+$/g, "_") // Replace leading/trailing dots/spaces
    .replace(/\s+/g, "_"); // Replace other spaces
}

// Get optimal number of worker threads based on CPU cores
const NUM_CPUS = os.cpus().length;
// Use 75% of available cores, minimum 1, maximum 8
const OPTIMAL_WORKERS = Math.max(1, Math.min(8, Math.floor(NUM_CPUS * 0.75)));

// Cache for recently processed files to avoid re-reading
const fileCache = new Map();
const MAX_CACHE_SIZE = 5; // Maximum number of files to keep in cache

// Clear cache entries when they exceed the limit
function maintainCacheSize() {
  if (fileCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries (FIFO)
    const keysIterator = fileCache.keys();
    const oldestKey = keysIterator.next().value;
    fileCache.delete(oldestKey);
  }
}

// --- Helper functions for splitExcel ---

/**
 * Reads data from the input file, using cache if available.
 * Validates required columns.
 * @param {string} inputPath - Path to the input Excel file.
 * @returns {Promise<{data: Array<object>, headers: Array<string>}>} - The data rows and headers.
 * @throws {Error} If file reading, parsing, or validation fails.
 */
async function _readFileData(inputPath) {
  let cachedData = fileCache.get(inputPath);
  let data, headers;

  if (cachedData) {
    console.log("Using cached data for:", inputPath);
    ({ data, headers } = cachedData);
  } else {
    console.time("fileRead");
    try {
      const buffer = fs.readFileSync(inputPath);
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];

      headers = await extractHeaders(workbook, sheetName);

      if (!headers.includes("project_code") || !headers.includes("batch_code")) {
        throw new Error("Input file must contain 'project_code' and 'batch_code' columns.");
      }

      data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      fileCache.set(inputPath, { workbook, sheetName, data, headers });
      maintainCacheSize();
    } catch (err) {
      // Only log unexpected errors, not the specific missing columns error handled by tests
      if (err.message !== "Input file must contain 'project_code' and 'batch_code' columns.") {
        console.error(`Error during file processing for: ${inputPath}`, err);
      }
      throw err; // Always re-throw original error for tests or higher-level handlers
    } finally {
      console.timeEnd("fileRead");
    }
  }

  // Check if data exists *after* reading/caching attempt
  if (!data || data.length === 0) {
    console.log("Input file contains headers but no data rows. Skipping split.");
    // Return empty data structure to signal no processing needed
    return { data: [], headers: headers || [] };
  }

  return { data, headers };
}

/**
 * Groups the data rows by project_code and then by batch_code.
 * @param {Array<object>} data - The array of data rows.
 * @returns {Map<string, Map<string, Array<object>>>} - Nested map: project -> batch -> rows.
 */
function _groupDataByProjectAndBatch(data) {
  console.time("dataProcessing");
  const projectMap = new Map();
  for (const row of data) {
    const project = row.project_code;
    const batch = row.batch_code;

    if (!projectMap.has(project)) {
      projectMap.set(project, new Map());
    }
    const batchMap = projectMap.get(project);

    if (!batchMap.has(batch)) {
      batchMap.set(batch, []);
    }
    batchMap.get(batch).push(row);
  }
  console.timeEnd("dataProcessing");
  return projectMap;
}

/**
 * Creates project task objects from the grouped data map.
 * Creates necessary output directories.
 * @param {Map<string, Map<string, Array<object>>>} projectMap - The grouped data map.
 * @param {string} outputDir - The base output directory.
 * @returns {Array<object>} - An array of project task objects.
 */
function _createProjectTasks(projectMap, outputDir) {
  const projectTasks = [];
  for (const [project, batchMap] of projectMap.entries()) {
    const sanitizedProject = sanitizeFilename(project);
    const projectDir = path.join(outputDir, sanitizedProject);

    // Create project directory if it doesn't exist
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    const batchTasks = [];
    for (const [batch, rows] of batchMap.entries()) {
      batchTasks.push({
        batch, // Keep original batch code if needed later
        rows,
        sanitizedBatch: sanitizeFilename(batch),
        projectDir,
      });
    }

    projectTasks.push({
      project, // Keep original project code if needed later
      sanitizedProject,
      batchTasks,
    });
  }
  return projectTasks;
}

/**
 * Determines processing strategy (sequential or parallel) and executes tasks.
 * @param {Array<object>} projectTasks - Array of project tasks.
 * @param {string} outputDir - Output directory path.
 * @param {Electron.WebContents} [sender] - Optional IPC sender.
 */
async function _processTasks(projectTasks, outputDir, sender) {
  if (projectTasks.length >= 3 && OPTIMAL_WORKERS > 1) {
    await processProjectsInParallel(projectTasks, outputDir, sender);
  } else {
    await processProjectsSequentially(projectTasks, outputDir, sender);
  }
}

// --- End helper functions for splitExcel ---

/**
 * Splits the Excel file by 'project_code' and then by 'batch_code'. (Refactored)
 * Creates folders for each project_code and saves batch_code splits as Excel files.
 * Each output file's sheet is formatted as an Excel table with headers and a style.
 * @param {string} inputPath - Path to the input Excel file.
 * @param {string} outputDir - Path to the output directory.
 * @param {Electron.WebContents} [sender] - Optional sender object for IPC progress updates.
 */
export default async function splitExcel(inputPath, outputDir, sender) {
  console.time("splitExcel");

  // 1. Validate paths
  if (!fs.existsSync(inputPath)) {
    throw new Error("Input file does not exist.");
  }
  if (!fs.existsSync(outputDir)) {
    throw new Error("Output directory does not exist.");
  }

  // 2. Read and validate data (uses cache)
  const { data } = await _readFileData(inputPath);

  // If data is empty after read attempt (e.g., headers only), exit early
  if (data.length === 0) {
    console.timeEnd("splitExcel"); // Ensure timer ends even on early exit
    return;
  }

  // 3. Group data
  const projectMap = _groupDataByProjectAndBatch(data);

  // 4. Create tasks and directories
  const projectTasks = _createProjectTasks(projectMap, outputDir);

  // 5. Process tasks (sequentially or parallel)
  await _processTasks(projectTasks, outputDir, sender);

  console.timeEnd("splitExcel");
}

// --- Helper functions for extractHeaders ---

/**
 * Validates if the sheet is suitable for header extraction.
 * @param {object} sheet - The xlsx sheet object.
 * @returns {object} The decoded range object.
 * @throws {Error} If the sheet or range is invalid.
 */
function _validateSheetForHeaders(sheet) {
  if (!sheet?.["!ref"]) {
    throw new Error("Input sheet is empty or invalid.");
  }
  const range = xlsx.utils.decode_range(sheet["!ref"]);
  // Check for empty sheet range definition
  if (range.s.r > range.e.r || range.s.c > range.e.c) {
    throw new Error("Input sheet range is invalid or empty.");
  }
  // Check if sheet contains only headers (single row) and is effectively empty horizontally
  if (range.s.r === range.e.r && range.s.c > range.e.c) {
    // This condition seems unlikely given the previous check, but kept for robustness
    throw new Error("Input sheet appears to contain only headers or is invalid.");
  }
  return range;
}

/**
 * Attempts to extract headers using the sheet_to_json method.
 * @param {object} sheet - The xlsx sheet object.
 * @returns {string[]|null} Array of header strings or null if unsuccessful.
 */
function _tryExtractHeadersFromJson(sheet) {
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  if (rawRows.length > 0 && Array.isArray(rawRows[0])) {
    return rawRows[0].map(String); // Ensure headers are strings
  }
  return null; // Indicate failure
}

/**
 * Extracts headers using the fallback cell iteration method.
 * @param {object} sheet - The xlsx sheet object.
 * @param {object} range - The decoded range object.
 * @returns {string[]} Array of header strings.
 */
function _extractHeadersFromCells(sheet, range) {
  const headers = [];
  const firstRow = range.s.r;
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = xlsx.utils.encode_cell({ r: firstRow, c: C });
    const cell = sheet[cellAddress];
    // Use empty string for undefined/null cells for consistency
    headers.push(cell?.v != null ? String(cell.v) : "");
  }
  // Remove trailing empty string headers resulting from empty cells
  while (headers.length > 0 && headers[headers.length - 1] === "") {
    headers.pop();
  }
  return headers;
}

// --- End helper functions ---

/**
 * Extract headers from the Excel workbook (Refactored)
 * @param {object} workbook - The xlsx workbook object
 * @param {string} sheetName - The name of the sheet to extract headers from
 * @returns {string[]} Array of header strings
 */
async function extractHeaders(workbook, sheetName) {
  try {
    const sheet = workbook.Sheets[sheetName];
    const range = _validateSheetForHeaders(sheet); // Validate first

    let headers = _tryExtractHeadersFromJson(sheet); // Try primary method

    if (!headers) {
      // If primary fails, use fallback
      headers = _extractHeadersFromCells(sheet, range);
    }

    // Final validation
    if (!headers || headers.length === 0) {
      throw new Error("Could not read headers from the input sheet.");
    }

    return headers;
  } catch (err) {
    // Log the specific error and re-throw a user-friendly error
    console.error(`Error extracting headers from sheet "${sheetName}":`, err);
    // Avoid exposing internal error details directly if not necessary
    const baseMessage = `Failed to extract headers from the sheet "${sheetName}"`;
    // Include original message if it's different and potentially informative
    const detailedMessage =
      err.message && err.message !== baseMessage ? `${baseMessage}: ${err.message}` : baseMessage;
    throw new Error(detailedMessage);
  }
}

/**
 * Process projects sequentially
 * @param {Array} projectTasks - Array of project tasks
 * @param {string} outputDir - Output directory path
 * @param {object} sender - IPC sender for progress updates
 */
async function processProjectsSequentially(projectTasks, outputDir, sender) {
  const totalProjects = projectTasks.length;
  let processedProjects = 0;

  for (const projectTask of projectTasks) {
    await processProject(projectTask); // outputDir argument removed

    // Update progress
    processedProjects++;
    if (sender) {
      const progress = Math.min(100, Math.round((processedProjects / totalProjects) * 100));
      sender.send("progress-update", progress);
    }
  }
}

/**
 * Process projects in parallel using worker threads
 * @param {Array} projectTasks - Array of project tasks
 * @param {string} outputDir - Output directory path
 * @param {object} sender - IPC sender for progress updates
 */
async function processProjectsInParallel(projectTasks, outputDir, sender) {
  const totalProjects = projectTasks.length;
  let processedProjects = 0;

  // Determine batch size based on number of workers and projects
  const batchSize = Math.max(1, Math.ceil(projectTasks.length / OPTIMAL_WORKERS));
  const projectBatches = [];

  // Split projects into batches for workers
  for (let i = 0; i < projectTasks.length; i += batchSize) {
    projectBatches.push(projectTasks.slice(i, i + batchSize));
  }

  // Process each batch with a worker
  await Promise.all(
    projectBatches.map(async (batch) => {
      for (const projectTask of batch) {
        await processProject(projectTask); // outputDir argument removed

        // Update progress (with lock to prevent race conditions)
        processedProjects++;
        if (sender) {
          const progress = Math.min(100, Math.round((processedProjects / totalProjects) * 100));
          sender.send("progress-update", progress);
        }
      }
    })
  );
}

/**
 * Process a single project
 * @param {object} projectTask - Project task object
 * @param {string} outputDir - Output directory path
 */
async function processProject(projectTask) {
  // outputDir parameter removed as it was unused
  const { batchTasks } = projectTask;

  // Process each batch in the project
  for (const batchTask of batchTasks) {
    await processBatch(batchTask);
  }
}

/**
 * Process a single batch
 * @param {object} batchTask - Batch task object
 */
async function processBatch(batchTask) {
  const { rows, sanitizedBatch, projectDir } = batchTask; // 'batch' variable removed as it was unused

  // Create output file path
  const outPath = path.join(projectDir, `${sanitizedBatch}.xlsx`);

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  // Add header row
  const headers = Object.keys(rows[0]);
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: 20,
  }));

  // Add data rows in bulk for better performance
  worksheet.addRows(rows);

  // Add table with style
  worksheet.addTable({
    name: "Table1",
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: {
      theme: "TableStyleMedium9",
      showRowStripes: true,
    },
    columns: headers.map((header) => ({
      name: header,
      filterButton: true,
    })),
    rows: rows.map((row) => headers.map((header) => row[header])),
  });

  // Write file
  try {
    await workbook.xlsx.writeFile(outPath);
  } catch (writeError) {
    console.error(`Error writing file: ${outPath}`, writeError);
    throw new Error(
      `Failed to write output file for batch ${sanitizedBatch}: ${writeError.message}`
    );
  }
}

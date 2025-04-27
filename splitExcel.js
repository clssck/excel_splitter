import ExcelJS from "exceljs";
import fs from "fs";
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

/**
 * Splits the Excel file by 'project_code' and then by 'batch_code'.
 * Creates folders for each project_code and saves batch_code splits as Excel files.
 * Each output file's sheet is formatted as an Excel table with headers and a style.
 * @param {string} inputPath - Path to the input Excel file.
 * @param {string} outputDir - Path to the output directory.
 * @param {Electron.WebContents} [sender] - Optional sender object for IPC progress updates.
 */
export default async function splitExcel(inputPath, outputDir, sender) {
  if (!fs.existsSync(inputPath)) {
    throw new Error("Input file does not exist.");
  }
  if (!fs.existsSync(outputDir)) {
    throw new Error("Output directory does not exist.");
  }

  let workbook;
  let sheetName;
  let data;

  try {
    // Read input using fs.readFileSync and xlsx.read
    const buffer = fs.readFileSync(inputPath);
    workbook = xlsx.read(buffer, { type: "buffer" });
    sheetName = workbook.SheetNames[0];
    data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  } catch (err) {
    // Handle errors during file reading or initial parsing
    console.error(`Error reading or parsing input file: ${inputPath}`, err);
    throw new Error(
      "Failed to read or parse input Excel file. It might be corrupted or an invalid format."
    );
  }

  // --- Refactored Header and Data Validation ---

  // 1. Get headers regardless of data presence
  let headers = [];
  try {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet["!ref"]) {
      // Sheet is empty or invalid range
      throw new Error("Input sheet is empty or invalid.");
    }

    // Attempt to get headers from the first row
    const range = xlsx.utils.decode_range(sheet["!ref"]);
    if (range.s.r === range.e.r && range.s.c > range.e.c) {
      // Handle case where sheet might have formatting but no cells
      throw new Error("Input sheet is empty or invalid.");
    }

    // Prioritize sheet_to_json with header:1 for robust header detection
    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (rawRows.length > 0 && Array.isArray(rawRows[0])) {
      headers = rawRows[0].map(String); // Ensure headers are strings
    } else {
      // Fallback: try reading first row cells directly if sheet_to_json fails
      // This might happen with unusual sheet structures
      const firstRow = range.s.r;
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = xlsx.utils.encode_cell({ r: firstRow, c: C });
        const cell = sheet[cellAddress];
        headers.push(cell ? String(cell.v) : undefined); // Handle empty header cells
      }
      // Remove trailing undefined headers if any
      while (headers.length > 0 && headers[headers.length - 1] === undefined) {
        headers.pop();
      }
    }

    if (headers.length === 0) {
      // If still no headers, the sheet is effectively empty or unreadable
      throw new Error("Could not read headers from the input sheet.");
    }
  } catch (err) {
    console.error("Error extracting headers:", err);
    // Rethrow a more specific error or the original one
    throw new Error(`Failed to extract headers from the sheet: ${err.message || err}`);
  }

  // 2. Validate required headers
  if (!headers.includes("project_code") || !headers.includes("batch_code")) {
    throw new Error("Input file must contain 'project_code' and 'batch_code' columns.");
  }

  // 3. Check if data exists
  if (data.length === 0) {
    // Headers are valid, but no data rows. This is not an error.
    console.log("Input file contains headers but no data rows. Skipping split.");
    // Optionally send a message back?
    // if (sender) sender.send('status-update', 'Input file has headers but no data.');
    return; // Exit successfully
  }

  // --- End Refactored Validation ---

  // Group by project_code
  const projects = {};
  for (const row of data) {
    const project = row.project_code;
    const batch = row.batch_code;
    if (!projects[project]) projects[project] = {};
    if (!projects[project][batch]) projects[project][batch] = [];
    projects[project][batch].push(row);
  }

  // Write files using exceljs for table formatting
  const projectKeys = Object.keys(projects);
  const totalProjects = projectKeys.length;
  let processedProjects = 0;

  for (const [project, batches] of Object.entries(projects)) {
    // Sanitize project code for directory name
    const sanitizedProject = sanitizeFilename(project);
    const projectDir = path.join(outputDir, sanitizedProject);
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    for (const [batch, rows] of Object.entries(batches)) {
      // Sanitize batch code for file name
      const sanitizedBatch = sanitizeFilename(batch);
      const outPath = path.join(projectDir, `${sanitizedBatch}.xlsx`);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sheet1");

      // Add header row
      const headers = Object.keys(rows[0]);
      worksheet.columns = headers.map((header) => ({
        header,
        key: header,
        width: 20,
      }));

      // Add data rows
      rows.forEach((row) => {
        worksheet.addRow(row);
      });

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

      // Add try-catch around file writing
      try {
        await workbook.xlsx.writeFile(outPath);
      } catch (writeError) {
        console.error(`Error writing file: ${outPath}`, writeError);
        // Re-throw the error to be caught by the main IPC handler
        throw new Error(
          `Failed to write output file for batch ${sanitizedBatch}: ${writeError.message}`
        );
      }
    }

    // --- Corrected Progress Reporting ---
    // Increment and report progress AFTER processing all batches for a project
    processedProjects++;
    if (sender) {
      // Ensure progress doesn't exceed 100 due to rounding
      const progress = Math.min(100, Math.round((processedProjects / totalProjects) * 100));
      sender.send("progress-update", progress); // Use 'progress-update' channel
    }
    // --- End Corrected Progress Reporting ---
  }
}

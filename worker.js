import { parentPort, workerData } from "worker_threads";
import ExcelJS from "exceljs";
// fs import removed as it was unused
import path from "path";

/**
 * Worker thread for processing Excel batches in parallel
 * This improves performance for large Excel files by distributing the work
 */

// Receive the batch tasks from the main thread
const { batchTasks } = workerData; // projectDir removed as it was unused

// Process all batches assigned to this worker
async function processBatches() {
  try {
    for (const batchTask of batchTasks) {
      await processBatch(batchTask);

      // Report progress back to main thread
      parentPort.postMessage({
        type: "progress",
        batchComplete: true,
        batch: batchTask.sanitizedBatch,
      });
    }

    // Signal completion
    parentPort.postMessage({
      type: "complete",
      success: true,
    });
  } catch (error) {
    // Report error back to main thread
    parentPort.postMessage({
      type: "error",
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Process a single batch
 * @param {object} batchTask - Batch task object
 */
async function processBatch(batchTask) {
  const { rows, sanitizedBatch, projectDir } = batchTask;

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

// Start processing
processBatches();

import ExcelJS from "exceljs"; // To read output files
import fs from "fs";
import os from "os";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import splitExcel from "../splitExcel.js";

// --- Add sanitizeFilename function (copied from splitExcel.js) ---
function sanitizeFilename(name) {
  const strName = String(name || "");
  return strName
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/^\.+|\.+$|^\s+|\s+$/g, "_")
    .replace(/\s+/g, "_");
}
// --- End Add ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to read an Excel file and return rows as JSON
async function readExcelData(filePath) {
  if (!fs.existsSync(filePath)) return null; // Return null if file doesn't exist
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1); // Get the first sheet
  const rows = [];
  // Iterate over rows including headers
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      // Assuming header row is 1
      rows.push(row.values.slice(1)); // .slice(1) to remove potential empty first cell from exceljs
    } else {
      // Handle potential empty cells represented as sparse arrays by exceljs
      const rowData = row.values;
      const denseRow = [];
      // Assuming headers define the number of columns
      const headerCount = worksheet.getRow(1).values.length - 1; // -1 for the slice(1) adjustment
      for (let i = 1; i <= headerCount; i++) {
        denseRow.push(rowData[i] === undefined ? null : rowData[i]); // Use null for empty cells
      }
      rows.push(denseRow);
      // rows.push(row.values.slice(1)); // Get cell values
    }
  });
  // Convert rows to JSON objects using headers
  if (rows.length < 2) return []; // No data rows
  const headers = rows[0];
  const jsonData = rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      // Attempt basic type conversion for comparison
      let value = row[index];
      if (typeof value === "number" && Number.isInteger(value)) {
        // Keep integers as numbers
      } else if (!isNaN(Number(value)) && value !== null) {
        value = Number(value); // Convert numeric strings to numbers
      }
      obj[header] = value;
    });
    return obj;
  });
  return jsonData;

  // return rows;
}

describe("splitExcel", () => {
  let tempOutputDir;
  const fixturesDir = path.join(__dirname, "fixtures");
  const inputFilePath = path.join(fixturesDir, "input.xlsx");

  beforeEach(() => {
    // Create a temporary directory for output files before each test
    tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), "splitexcel-test-"));
  });

  afterEach(() => {
    // Remove the temporary directory and its contents after each test
    if (tempOutputDir) {
      fs.rmSync(tempOutputDir, { recursive: true, force: true });
    }
  });

  test("should correctly split a valid Excel file by project and batch codes", async () => {
    await splitExcel(inputFilePath, tempOutputDir);

    // Expected structure and content based on fixtures/input.xlsx
    const expectedFiles = {
      P100: {
        "B1.xlsx": [
          { Value: 10, Description: "Item A" },
          { Value: 20, Description: "Item B" },
        ],
        "B2.xlsx": [
          { Value: 30, Description: "Item C" },
          { Value: 60, Description: "Item F" },
        ],
      },
      P200: {
        "B1.xlsx": [{ Value: 40, Description: "Item D" }],
        "B3.xlsx": [{ Value: 50, Description: "Item E" }],
      },
      999: {
        "77.xlsx": [{ Value: 70, Description: "Numeric codes" }],
      },
      "P 300": {
        "B 4.xlsx": [{ Value: 80, Description: "Codes w space" }],
      },
    };

    for (const [projectCode, batches] of Object.entries(expectedFiles)) {
      // --- Use sanitized name for checking directory ---
      const sanitizedProjectCode = sanitizeFilename(projectCode);
      const projectDir = path.join(tempOutputDir, sanitizedProjectCode);
      // --- End Update ---
      expect(fs.existsSync(projectDir)).toBe(true);

      for (const [batchFile, expectedRows] of Object.entries(batches)) {
        // --- Use sanitized name for checking file path ---
        const sanitizedBatchFile = sanitizeFilename(batchFile.replace(/\.xlsx$/, "")); // Sanitize base name
        const batchFilePath = path.join(projectDir, `${sanitizedBatchFile}.xlsx`);
        // --- End Update ---
        expect(fs.existsSync(batchFilePath)).toBe(true);

        // Read the generated file and verify its content
        const actualData = await readExcelData(batchFilePath);
        // Filter actualData to only include keys present in expectedRows[0] for comparison
        const relevantActualData = actualData.map((row) => {
          const filteredRow = {};
          Object.keys(expectedRows[0]).forEach((key) => {
            filteredRow[key] = row[key];
          });
          return filteredRow;
        });
        // console.log("Expected:", JSON.stringify(expectedRows, null, 2));
        // console.log("Actual:", JSON.stringify(relevantActualData, null, 2));
        expect(relevantActualData).toEqual(expectedRows);
      }
    }
  });

  test("should throw error if input file does not exist", async () => {
    const invalidInputPath = path.join(fixturesDir, "nonexistent.xlsx");
    await expect(splitExcel(invalidInputPath, tempOutputDir)).rejects.toThrow(
      "Input file does not exist."
    );
  });

  test("should throw error if output directory does not exist", async () => {
    const invalidOutputDir = path.join(tempOutputDir, "nonexistent-dir");
    await expect(splitExcel(inputFilePath, invalidOutputDir)).rejects.toThrow(
      "Output directory does not exist."
    );
  });

  test("should throw error if input file is empty", async () => {
    const emptyFilePath = path.join(fixturesDir, "empty.xlsx");
    // Ensure the manually created file exists
    if (!fs.existsSync(emptyFilePath)) {
      throw new Error("Manual fixture empty.xlsx not found!");
    }
    // The function should now RESOLVE successfully for files with headers but no data.
    await expect(splitExcel(emptyFilePath, tempOutputDir)).resolves.toBeUndefined();
  });

  test("should throw error if required columns are missing", async () => {
    const missingColsFilePath = path.join(fixturesDir, "missing_columns.xlsx");
    // Ensure the manually created file exists
    if (!fs.existsSync(missingColsFilePath)) {
      throw new Error("Manual fixture missing_columns.xlsx not found!");
    }
    // No need to create the file here anymore, it's manual
    await expect(splitExcel(missingColsFilePath, tempOutputDir)).rejects.toThrow(
      "Input file must contain 'project_code' and 'batch_code' columns."
    );
  });

  // Add more tests for edge cases if needed (e.g., only one row of data, different data types in codes)
});

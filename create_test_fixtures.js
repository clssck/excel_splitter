import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import xlsx from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = path.join(__dirname, "test", "fixtures");

// Ensure fixtures directory exists
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
  console.log(`Created fixtures directory: ${fixturesDir}`);
}

// --- Create empty.xlsx ---
try {
  const emptyWorkbook = xlsx.utils.book_new();
  const emptyWorksheet = xlsx.utils.aoa_to_sheet([
    ["project_code", "batch_code", "Value", "Description"], // Headers only
  ]);
  xlsx.utils.book_append_sheet(emptyWorkbook, emptyWorksheet, "Sheet1");
  const emptyFilePath = path.join(fixturesDir, "empty.xlsx");
  xlsx.writeFile(emptyWorkbook, emptyFilePath);
  console.log(`Successfully created empty fixture at ${emptyFilePath}`);
} catch (err) {
  console.error(`Error creating empty.xlsx: ${err}`);
}

// --- Create missing_columns.xlsx ---
try {
  const missingColsWorkbook = xlsx.utils.book_new();
  const missingColsWorksheet = xlsx.utils.aoa_to_sheet([
    ["project_code", "Value", "Description"], // Missing batch_code
    ["P1", 100, "Test Item 1"],
    ["P2", 200, "Test Item 2"],
  ]);
  xlsx.utils.book_append_sheet(missingColsWorkbook, missingColsWorksheet, "Sheet1");
  const missingColsFilePath = path.join(fixturesDir, "missing_columns.xlsx");
  xlsx.writeFile(missingColsWorkbook, missingColsFilePath);
  console.log(`Successfully created missing columns fixture at ${missingColsFilePath}`);
} catch (err) {
  console.error(`Error creating missing_columns.xlsx: ${err}`);
}

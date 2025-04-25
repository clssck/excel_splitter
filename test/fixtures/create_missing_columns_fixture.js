import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create an Excel file with missing batch_code column
const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.aoa_to_sheet([
  ["project_code", "Value", "Description"], // Missing batch_code
  ["P1", 100, "Test item"],
]);
xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

const missingColumnsFilePath = path.join(__dirname, "missing_columns.xlsx");
xlsx.writeFile(workbook, missingColumnsFilePath);
console.log(`Created missing columns fixture at ${missingColumnsFilePath}`);

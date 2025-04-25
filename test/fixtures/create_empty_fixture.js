import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create an empty Excel file with just headers
const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.aoa_to_sheet([
  ["project_code", "batch_code", "Value", "Description"], // Headers only
]);
xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

const emptyFilePath = path.join(__dirname, "empty.xlsx");
xlsx.writeFile(workbook, emptyFilePath);
console.log(`Created empty fixture at ${emptyFilePath}`);

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const ws_data = [["irrelevant_column"], ["value1"], ["value2"]];
const ws = XLSX.utils.aoa_to_sheet(ws_data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const outPath = path.join(__dirname, "missing_columns.xlsx");
XLSX.writeFile(wb, outPath);

console.log('Created test/fixtures/missing_columns.xlsx with only "irrelevant_column".');

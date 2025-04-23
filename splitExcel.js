const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");

/**
 * Splits the Excel file by 'project_code' and then by 'batch_code'.
 * Creates folders for each project_code and saves batch_code splits as Excel files.
 * Each output file's sheet is formatted as an Excel table with headers and a style.
 * @param {string} inputPath - Path to the input Excel file.
 * @param {string} outputDir - Path to the output directory.
 */
module.exports = async function splitExcel(inputPath, outputDir) {
  if (!fs.existsSync(inputPath)) {
    throw new Error("Input file does not exist.");
  }
  if (!fs.existsSync(outputDir)) {
    throw new Error("Output directory does not exist.");
  }

  // Read input using xlsx for compatibility
  const workbook = xlsx.readFile(inputPath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  if (!data.length) {
    throw new Error("Input Excel file is empty or invalid.");
  }
  if (!("project_code" in data[0]) || !("batch_code" in data[0])) {
    throw new Error(
      "Input file must contain 'project_code' and 'batch_code' columns."
    );
  }

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
  for (const [project, batches] of Object.entries(projects)) {
    const projectDir = path.join(outputDir, String(project));
    if (!fs.existsSync(projectDir))
      fs.mkdirSync(projectDir, { recursive: true });

    for (const [batch, rows] of Object.entries(batches)) {
      const outPath = path.join(projectDir, `${batch}.xlsx`);
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

      await workbook.xlsx.writeFile(outPath);
    }
  }
};

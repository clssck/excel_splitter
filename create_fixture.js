// File: create_fixture.js
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const fixturesDir = path.join(__dirname, "test", "fixtures");
const outputFilePath = path.join(fixturesDir, "input.xlsx");

// Ensure the fixtures directory exists
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
  console.log(`Created directory: ${fixturesDir}`);
}

async function createInputFixture() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  // Define headers and columns
  worksheet.columns = [
    { header: "project_code", key: "project_code", width: 15 },
    { header: "batch_code", key: "batch_code", width: 15 },
    { header: "Value", key: "Value", width: 10 },
    { header: "Description", key: "Description", width: 20 },
  ];

  // Add rows based on the defined structure
  worksheet.addRows([
    { project_code: "P100", batch_code: "B1", Value: 10, Description: "Item A" },
    { project_code: "P100", batch_code: "B1", Value: 20, Description: "Item B" },
    { project_code: "P100", batch_code: "B2", Value: 30, Description: "Item C" },
    { project_code: "P200", batch_code: "B1", Value: 40, Description: "Item D" },
    { project_code: "P200", batch_code: "B3", Value: 50, Description: "Item E" },
    { project_code: "P100", batch_code: "B2", Value: 60, Description: "Item F" },
    { project_code: 999, batch_code: 77, Value: 70, Description: "Numeric codes" }, // Use numbers directly
    { project_code: "P 300", batch_code: "B 4", Value: 80, Description: "Codes w space" },
  ]);

  try {
    await workbook.xlsx.writeFile(outputFilePath);
    console.log(`Successfully created fixture file: ${outputFilePath}`);
  } catch (error) {
    console.error("Error creating fixture file:", error);
  }
}

createInputFixture();

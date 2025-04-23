window.addEventListener("DOMContentLoaded", () => {
  const inputFile = document.getElementById("inputFile");
  const outputDir = document.getElementById("outputDir");
  const browseInput = document.getElementById("browseInput");
  const browseOutput = document.getElementById("browseOutput");
  const splitBtn = document.getElementById("splitBtn");
  const statusDiv = document.getElementById("status");
  const errorDiv = document.getElementById("error");

  browseInput.addEventListener("click", async () => {
    const filePath = await window.electronAPI.selectExcelFile();
    if (filePath) {
      inputFile.value = filePath;
      statusDiv.textContent = "";
      errorDiv.textContent = "";
    }
  });

  browseOutput.addEventListener("click", async () => {
    const dirPath = await window.electronAPI.selectOutputDir();
    if (dirPath) {
      outputDir.value = dirPath;
      statusDiv.textContent = "";
      errorDiv.textContent = "";
    }
  });

  splitBtn.addEventListener("click", async () => {
    statusDiv.textContent = "";
    errorDiv.textContent = "";
    const inputPath = inputFile.value;
    const outDir = outputDir.value;
    if (!inputPath) {
      errorDiv.textContent = "Please select an input Excel file.";
      return;
    }
    if (!outDir) {
      errorDiv.textContent = "Please select an output directory.";
      return;
    }
    statusDiv.textContent = "Processing...";
    try {
      const result = await window.electronAPI.splitExcel(inputPath, outDir);
      if (result.success) {
        statusDiv.textContent = "Files split and saved successfully.";
      } else {
        errorDiv.textContent =
          result.error || "An error occurred during splitting.";
      }
    } catch (err) {
      errorDiv.textContent = err.message || String(err);
    }
  });
});

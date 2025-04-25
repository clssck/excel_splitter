window.addEventListener("DOMContentLoaded", () => {
  // --- Test contextBridge ---
  console.log("Testing electronAPI object:", window.electronAPI);
  try {
    console.log("Calling testPing:", window.electronAPI.testPing());
  } catch (err) {
    console.error("Error calling testPing:", err);
  }
  // --- End Test ---

  const inputFile = document.getElementById("inputFile");
  const outputDir = document.getElementById("outputDir");
  const browseInput = document.getElementById("browseInput");
  const browseOutput = document.getElementById("browseOutput");
  const splitBtn = document.getElementById("splitBtn");
  const statusDiv = document.getElementById("status");
  const errorDiv = document.getElementById("error");

  let isDialogOpen = false; // Flag to prevent multiple dialogs

  // Handle progress updates from main process
  // Temporarily commented out for debugging
  // window.electronAPI.onProgressUpdate((progress) => {
  //   statusDiv.textContent = `Processing... ${progress}%`;
  // });

  browseInput.addEventListener("click", async () => {
    if (isDialogOpen) return; // Prevent opening multiple dialogs
    isDialogOpen = true;
    try {
      const filePath = await window.electronAPI.selectExcelFile();
      if (filePath) {
        inputFile.value = filePath;
        statusDiv.textContent = "";
        errorDiv.textContent = "";
      }
    } catch (err) {
      console.error("Error selecting input file:", err);
      errorDiv.textContent = "Failed to open file dialog.";
    } finally {
      isDialogOpen = false; // Reset flag
    }
  });

  browseOutput.addEventListener("click", async () => {
    if (isDialogOpen) return; // Prevent opening multiple dialogs
    isDialogOpen = true;
    try {
      const dirPath = await window.electronAPI.selectOutputDir();
      if (dirPath) {
        outputDir.value = dirPath;
        statusDiv.textContent = "";
        errorDiv.textContent = "";
      }
    } catch (err) {
      console.error("Error selecting output directory:", err);
      errorDiv.textContent = "Failed to open directory dialog.";
    } finally {
      isDialogOpen = false; // Reset flag
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

    // Disable button and show initial status
    splitBtn.disabled = true;
    splitBtn.textContent = "Splitting..."; // Optional: Change button text
    statusDiv.textContent = "Processing... 0%";

    try {
      const result = await window.electronAPI.splitExcel(inputPath, outDir);
      if (result.success) {
        statusDiv.textContent = "Files split and saved successfully.";
      } else {
        // Keep progress message if splitting finished but had an error reported
        errorDiv.textContent = result.error || "An error occurred during splitting.";
        if (!statusDiv.textContent.includes("Processing")) {
          statusDiv.textContent = ""; // Clear status only if it wasn't showing progress
        }
      }
    } catch (err) {
      // Handle errors from the invoke call itself (e.g., main process crash)
      errorDiv.textContent = err.message || String(err);
      statusDiv.textContent = ""; // Clear status on invoke error
    } finally {
      // Re-enable button regardless of success or failure
      splitBtn.disabled = false;
      splitBtn.textContent = "Split File"; // Restore original text
      // Optional: Clear progress text a bit later or on next action
      // setTimeout(() => {
      //   if (statusDiv.textContent.includes("Processing")) {
      //     statusDiv.textContent = "";
      //   }
      // }, 5000); // Clear after 5 seconds if still showing progress
    }
  });
});

/* --- Easter Egg: Doom God Mode Matrix Emoji Rain --- */
(() => {
  const sequence = "iddqd";
  let buffer = "";
  const emojiList = [
    "💀",
    "😈",
    "👾",
    "🔥",
    "⚡",
    "🦾",
    "🕹️",
    "🎮",
    "👽",
    "🤖",
    "🧬",
    "🦸",
    "🦹",
    "🧟",
    "🧙",
    "🧛",
    "🦸‍♂️",
    "🦸‍♀️",
    "🦹‍♂️",
    "🦹‍♀️",
    "🧞",
    "🧞‍♂️",
    "🧞‍♀️",
    "🦄",
    "🌌",
    "🌠",
    "🌟",
    "✨",
    "💫",
    "🛸",
    "🚀",
    "🧨",
    "💣",
    "🔮",
    "🪐",
    "☄️",
    "🌈",
  ];
  let rainActive = false;
  let rainContainer = null;
  let animationFrame = null;
  let columns = [];
  let fontSize = 32;

  function startEmojiRain() {
    if (rainActive) return;
    rainActive = true;

    // Create overlay
    rainContainer = document.createElement("canvas");
    rainContainer.style.position = "fixed";
    rainContainer.style.top = 0;
    rainContainer.style.left = 0;
    rainContainer.style.width = "100vw";
    rainContainer.style.height = "100vh";
    rainContainer.style.pointerEvents = "none";
    rainContainer.style.zIndex = 9999;
    rainContainer.width = window.innerWidth;
    rainContainer.height = window.innerHeight;
    document.body.appendChild(rainContainer);

    const ctx = rainContainer.getContext("2d");
    fontSize = Math.max(24, Math.floor(window.innerWidth / 40));
    const cols = Math.floor(window.innerWidth / fontSize);
    columns = Array(cols).fill(0);

    function draw() {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, rainContainer.width, rainContainer.height);
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = "center";
      for (let i = 0; i < columns.length; i++) {
        const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
        const x = i * fontSize + fontSize / 2;
        const y = columns[i] * fontSize + fontSize;
        ctx.fillStyle = "#00ff00";
        ctx.fillText(emoji, x, y);
        if (y > rainContainer.height && Math.random() > 0.975) {
          columns[i] = 0;
        } else {
          columns[i]++;
        }
      }
      animationFrame = requestAnimationFrame(draw);
    }
    draw();

    // Dismiss on Escape
    window.addEventListener("keydown", dismissRain, { once: true });
    window.addEventListener("resize", resizeRain);
  }

  function dismissRain(e) {
    if (e && e.key !== "Escape") {
      window.addEventListener("keydown", dismissRain, { once: true });
      return;
    }
    rainActive = false;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (rainContainer) {
      rainContainer.remove();
      rainContainer = null;
    }
    window.removeEventListener("resize", resizeRain);
  }

  function resizeRain() {
    if (!rainContainer) return;
    rainContainer.width = window.innerWidth;
    rainContainer.height = window.innerHeight;
    fontSize = Math.max(24, Math.floor(window.innerWidth / 40));
    const cols = Math.floor(window.innerWidth / fontSize);
    columns = Array(cols).fill(0);
  }

  window.addEventListener("keydown", (e) => {
    if (rainActive) return;
    if (e.key.length === 1) {
      buffer += e.key.toLowerCase();
      if (buffer.length > sequence.length) buffer = buffer.slice(-sequence.length);
      if (buffer.replace(/\s+/g, "") === sequence.replace(/\s+/g, "")) {
        startEmojiRain();
        buffer = "";
      }
    } else if (e.key === " ") {
      buffer += " ";
    }
  });
})();

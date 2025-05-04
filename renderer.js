window.addEventListener("DOMContentLoaded", () => {
  // --- Test contextBridge ---
  console.log("Testing electronAPI object:", window.electronAPI);
  try {
    console.log("Calling testPing:", window.electronAPI.testPing());
  } catch (err) {
    console.error("Error calling testPing:", err);
  }
  // --- End Test ---

  // Get update-related elements
  const updateStatusDiv = document.getElementById("update-status");
  const updateMessageDiv = document.getElementById("update-message");
  const updateActionsDiv = document.getElementById("update-actions");
  const updateButton = document.getElementById("update-button");

  let updateUrl = null;

  // Handle update button click
  updateButton.addEventListener("click", async () => {
    if (updateUrl) {
      try {
        await window.electronAPI.openUpdateLink(updateUrl);
      } catch (err) {
        console.error("Error opening update link:", err);
      }
    }
  });

  // Register handler for update status events
  window.electronAPI.onUpdateStatus((status) => {
    console.log("Received update status:", status);

    // Show the update status section
    updateStatusDiv.style.display = "block";

    // Handle different status types
    if (status.type === "checking") {
      updateMessageDiv.textContent = "Checking for updates...";
      updateActionsDiv.style.display = "none";
      updateMessageDiv.style.color = "#a0bfff";
    } else if (status.type === "available") {
      // Format the version display based on whether it's a standard version or not
      const versionDisplay = status.version.includes("non-standard")
        ? status.version
        : `v${status.version}`;

      updateMessageDiv.textContent = `Update available: ${versionDisplay} (you have v${status.currentVersion})`;
      updateUrl = status.url;
      updateActionsDiv.style.display = "block";
      updateMessageDiv.style.color = "#4fd18c";
    } else if (status.type === "not-available") {
      updateMessageDiv.textContent = `You're using the latest version (v${status.currentVersion})`;
      updateActionsDiv.style.display = "none";
      updateMessageDiv.style.color = "#a0bfff";

      // Hide the update status after 5 seconds
      setTimeout(() => {
        updateStatusDiv.style.display = "none";
      }, 5000);
    } else if (status.type === "error") {
      updateMessageDiv.textContent = `Update check failed: ${status.error}`;
      updateActionsDiv.style.display = "none";
      updateMessageDiv.style.color = "#ff4d4f";

      // Hide the update status after 5 seconds
      setTimeout(() => {
        updateStatusDiv.style.display = "none";
      }, 5000);
    } else if (status.type === "no-releases") {
      updateMessageDiv.textContent = `No official releases found (current: v${status.currentVersion})`;
      updateActionsDiv.style.display = "none";
      updateMessageDiv.style.color = "#a0bfff";

      // Hide the update status after 5 seconds
      setTimeout(() => {
        updateStatusDiv.style.display = "none";
      }, 5000);
    }
  });

  // Check for updates when the app starts
  setTimeout(() => {
    window.electronAPI.checkForUpdates();
  }, 1000);

  const inputFile = document.getElementById("inputFile");
  const outputDir = document.getElementById("outputDir");
  const browseInput = document.getElementById("browseInput");
  const browseOutput = document.getElementById("browseOutput");
  const splitBtn = document.getElementById("splitBtn");
  const statusDiv = document.getElementById("status");
  const errorDiv = document.getElementById("error");

  let isDialogOpen = false; // Flag to prevent multiple dialogs

  // Handle progress updates from main process
  window.electronAPI.onProgressUpdate((progress) => {
    // Update progress with animation for smoother UI
    requestAnimationFrame(() => {
      statusDiv.textContent = `Processing... ${progress}%`;

      // Optional: Update a progress bar if you add one to the UI
      // const progressBar = document.getElementById('progressBar');
      // if (progressBar) progressBar.value = progress;
    });
  });

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

  // Add a debounce function to prevent multiple rapid clicks
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Create a progress bar element
  const progressBarContainer = document.createElement("div");
  progressBarContainer.style.width = "100%";
  progressBarContainer.style.height = "6px";
  progressBarContainer.style.backgroundColor = "#232526";
  progressBarContainer.style.borderRadius = "3px";
  progressBarContainer.style.marginTop = "10px";
  progressBarContainer.style.overflow = "hidden";
  progressBarContainer.style.display = "none";

  const progressBar = document.createElement("div");
  progressBar.style.width = "0%";
  progressBar.style.height = "100%";
  progressBar.style.backgroundColor = "var(--accent)";
  progressBar.style.transition = "width 0.3s ease-in-out";

  progressBarContainer.appendChild(progressBar);
  document.querySelector(".row:nth-child(3)").appendChild(progressBarContainer);

  // Update the progress bar with debounced updates to improve performance
  window.electronAPI.onProgressUpdate(
    debounce((progress) => {
      progressBar.style.width = `${progress}%`;
    }, 50)
  ); // 50ms debounce time

  // Handle split button click with optimized UI feedback
  splitBtn.addEventListener(
    "click",
    debounce(async () => {
      // Clear previous messages
      statusDiv.textContent = "";
      errorDiv.textContent = "";

      // Get input and output paths
      const inputPath = inputFile.value;
      const outDir = outputDir.value;

      // Validate inputs
      if (!inputPath) {
        errorDiv.textContent = "Please select an input Excel file.";
        return;
      }
      if (!outDir) {
        errorDiv.textContent = "Please select an output directory.";
        return;
      }

      // Disable button and show initial status with animation
      splitBtn.disabled = true;
      splitBtn.textContent = "Splitting...";
      statusDiv.textContent = "Preparing...";

      // Show progress bar
      progressBarContainer.style.display = "block";
      progressBar.style.width = "0%";

      // Add a small delay to allow UI to update before heavy processing
      setTimeout(async () => {
        try {
          // Start the actual processing
          const startTime = performance.now();
          const result = await window.electronAPI.splitExcel(inputPath, outDir);
          const endTime = performance.now();
          const processingTime = ((endTime - startTime) / 1000).toFixed(2);

          if (result.success) {
            // Success message with processing time
            statusDiv.textContent = `Files split and saved successfully in ${processingTime} seconds.`;

            // Animate progress to 100% for visual completion
            progressBar.style.width = "100%";

            // Hide progress bar after a delay
            setTimeout(() => {
              progressBarContainer.style.display = "none";
            }, 1500);
          } else {
            // Error handling
            errorDiv.textContent = result.error || "An error occurred during splitting.";
            progressBarContainer.style.display = "none";
          }
        } catch (err) {
          // Handle errors from the invoke call itself
          errorDiv.textContent = err.message || String(err);
          statusDiv.textContent = "";
          progressBarContainer.style.display = "none";
        } finally {
          // Re-enable button with a small delay to prevent accidental double-clicks
          setTimeout(() => {
            splitBtn.disabled = false;
            splitBtn.textContent = "Split File";
          }, 500);
        }
      }, 50); // Small delay for UI responsiveness
    }, 300)
  ); // 300ms debounce time to prevent accidental double-clicks
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

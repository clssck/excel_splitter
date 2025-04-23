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
        errorDiv.textContent = result.error || "An error occurred during splitting.";
      }
    } catch (err) {
      errorDiv.textContent = err.message || String(err);
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

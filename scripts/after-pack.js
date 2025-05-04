// This script runs after the app is packaged
// It handles post-packaging tasks like fixing permissions and creating necessary files

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

exports.default = async function(context) {
  const { appOutDir, packager, electronPlatformName, arch } = context;
  
  console.log(`Running after-pack script for ${electronPlatformName}-${arch}`);
  
  // Only run for macOS
  if (electronPlatformName !== "darwin") {
    console.log("Not macOS, skipping macOS-specific tasks");
    return;
  }
  
  try {
    // Path to the app bundle
    const appBundlePath = path.join(appOutDir, `${packager.appInfo.productName}.app`);
    console.log(`App bundle path: ${appBundlePath}`);
    
    // Create AppData directory
    const appDataPath = path.join(appOutDir, "AppData");
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
      console.log(`Created AppData directory: ${appDataPath}`);
    }
    
    // Create portable_mode marker file
    const portableMarkerPath = path.join(appOutDir, "portable_mode");
    fs.writeFileSync(portableMarkerPath, "");
    console.log(`Created portable_mode marker: ${portableMarkerPath}`);
    
    // Fix permissions for macOS app bundle
    const macOSDir = path.join(appBundlePath, "Contents", "MacOS");
    console.log(`Fixing permissions for: ${macOSDir}`);
    
    try {
      execSync(`chmod -R +x "${macOSDir}"`);
      console.log("Fixed executable permissions");
    } catch (err) {
      console.error("Error fixing permissions:", err);
    }
    
    // Create a README file
    const readmePath = path.join(appOutDir, "README.txt");
    const readmeContent = `ExcelChopper Portable for macOS

This is a portable version of ExcelChopper that works without installation.

HOW TO USE:
1. Extract this zip file anywhere (USB drive, Downloads folder, Desktop, etc.)
2. Double-click the ExcelChopper.app to run it

TROUBLESHOOTING:
If you get a security warning when trying to run the app:
1. Right-click (or Control+click) on ExcelChopper.app
2. Select "Open" from the context menu
3. Click "Open" in the security dialog

This only needs to be done once.

All data is stored in the AppData folder next to the app.
`;
    
    fs.writeFileSync(readmePath, readmeContent);
    console.log(`Created README file: ${readmePath}`);
    
    console.log("After-pack tasks completed successfully");
  } catch (err) {
    console.error("Error in after-pack script:", err);
    throw err;
  }
};

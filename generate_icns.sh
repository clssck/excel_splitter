#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

# Define paths
SOURCE_ICON="build/splitter_sprite.png"
ICONSET_DIR="build/temp_icon.iconset"
OUTPUT_ICNS="build/icon.icns"

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
  echo "Error: Source icon not found at $SOURCE_ICON" >&2
  exit 1
fi

# Check if iconutil is available
if ! command -v iconutil &> /dev/null; then
    echo "Error: 'iconutil' command not found. This script requires macOS." >&2
    exit 1
fi

# Check if sips is available
if ! command -v sips &> /dev/null; then
    echo "Error: 'sips' command not found. This script requires macOS." >&2
    exit 1
fi

# Create or clean the iconset directory
mkdir -p "$ICONSET_DIR"
rm -f "${ICONSET_DIR}"/*.png # Clean old files if any

# Required sizes (WxH)
SIZES=(16 32 128 256 512)

echo "Generating icon sizes into ${ICONSET_DIR}..."

# Generate standard and retina (@2x) sizes using sips
for SIZE in "${SIZES[@]}"; do
  echo "  Generating ${SIZE}x${SIZE}..."
  sips -z $SIZE $SIZE "$SOURCE_ICON" --out "${ICONSET_DIR}/icon_${SIZE}x${SIZE}.png" > /dev/null 2>&1
  echo "  Generating ${SIZE}x${SIZE}@2x..."
  sips -z $((SIZE * 2)) $((SIZE * 2)) "$SOURCE_ICON" --out "${ICONSET_DIR}/icon_${SIZE}x${SIZE}@2x.png" > /dev/null 2>&1
done

# Special case for 32x32@2x - Commented out as loop handles it
# cp "${ICONSET_DIR}/icon_64x64.png" "${ICONSET_DIR}/icon_32x32@2x.png"

# Special case for 64x64 (used by iconutil for 32x32@2x)
# Size 64 is technically not needed in the SIZES array if handled as 32@2x
# sips -z 64 64 "$SOURCE_ICON" --out "${ICONSET_DIR}/icon_64x64.png" > /dev/null 2>&1
# cp "${ICONSET_DIR}/icon_64x64.png" "${ICONSET_DIR}/icon_32x32@2x.png"

echo "Creating .icns file at ${OUTPUT_ICNS}..."
iconutil -c icns "$ICONSET_DIR" -o "$OUTPUT_ICNS"

echo "Cleaning up temporary directory ${ICONSET_DIR}..."
rm -rf "$ICONSET_DIR"

echo "Successfully created $OUTPUT_ICNS"
exit 0

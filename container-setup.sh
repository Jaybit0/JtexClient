#!/bin/bash
set -euo pipefail

echo "Configuring JTeX runtime inside container..."

VERSION=$(node -p "require('./package.json').version")
TARGET_DIR="/usr/local/lib/jtex/v${VERSION}"
SYMLINK_NAME="jtex"

mkdir -p "$TARGET_DIR"

echo " - Installing application files into $TARGET_DIR"
node ./dosetup.js "$TARGET_DIR"

echo " - Ensuring launch scripts are executable"
chmod +x "$TARGET_DIR/jtex.sh"
if [ -f "$TARGET_DIR/jtex-docker.sh" ]; then
    chmod +x "$TARGET_DIR/jtex-docker.sh"
fi

echo " - Linking /usr/local/bin/$SYMLINK_NAME"
ln -sf "$TARGET_DIR/jtex.sh" "/usr/local/bin/$SYMLINK_NAME"

echo "Container setup completed for JTeX v${VERSION}."

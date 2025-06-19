#!/bin/bash

# This script is intended to be run inside a Docker container
# where core dependencies (Node.js, TeX Live) are already installed by the Dockerfile.

# No need to check for elevated permissions; Docker RUN commands are already root.
# No need for platform checks; this is for Linux (Ubuntu) in the container.
# No need to check/install tex, curl, node, npm; they are pre-installed by Dockerfile.
# No need to kill existing processes; this is a fresh build/run environment.

# Define the source file, target directory, and symlink name
# Assuming VERSION is passed as an environment variable or hardcoded if fixed.
# If VERSION is meant to be dynamic, consider passing it as an argument or ENV var in Dockerfile.
# For demonstration, hardcoding as per your original script.
VERSION="0.0.8"
SOURCE_FILE="jtex.sh"
TARGET_DIR="/usr/local/lib/jtex/v$VERSION"
SYMLINK_NAME="jtex"

echo "Running install-docker.sh for JTex version $VERSION..."

# Create the target directory if it doesn't exist
# No 'sudo' needed as RUN commands are root.
mkdir -p "$TARGET_DIR"

if [ $? -ne 0 ]; then
    echo "Error: Could not create the target directory $TARGET_DIR."
    exit 1
fi

# npm install and npm update are typically handled by the Dockerfile's npm install.
# If your dosetup.js (or other parts of your app) require re-running npm install/update
# *after* the initial Dockerfile's npm install, keep these. Otherwise, they might be redundant here.
# For a clean build, they are likely already handled by the Dockerfile.
# I'm commenting them out as they are often done in the Dockerfile.
# npm install
# npm update

# Run dosetup.js
# Ensure node is in PATH (it should be if installed via NodeSource in Dockerfile)
echo "Running Node.js setup script (dosetup.js)..."
node "./dosetup.js" "$TARGET_DIR"

if [ $? -ne 0 ]; then
    echo "Error: dosetup.js failed."
    exit 1
fi

# Copy the jtex.sh script to the target directory
echo "Copying $SOURCE_FILE to $TARGET_DIR..."
cp "$SOURCE_FILE" "$TARGET_DIR"

if [ $? -ne 0 ]; then
    echo "Error: Could not copy $SOURCE_FILE to $TARGET_DIR."
    exit 1
fi

# Make the copied script executable
chmod +x "$TARGET_DIR/$SOURCE_FILE"

# Create a symlink in /usr/local/bin to call your script from any directory
echo "Creating symlink for $SYMLINK_NAME in /usr/local/bin..."
# No 'sudo' needed as RUN commands are root.
ln -sf "$TARGET_DIR/$SOURCE_FILE" "/usr/local/bin/$SYMLINK_NAME"

if [ $? -ne 0 ]; then
    echo "Error: Could not create symlink for $SYMLINK_NAME."
    exit 1
fi

echo "JTex installation for Docker complete."

exit 0
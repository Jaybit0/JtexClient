#!/bin/bash
pid=$1

if [ ! -z "$pid" ]; then
  # Terminate the current Node.js script
  kill $pid

  # Wait for the Node.js script to exit
  while kill -0 $pid 2> /dev/null; do
    sleep 1
  done
fi

# Check if tex is installed
if ! command -v tex &> /dev/null; then
    echo "Tex could not be found. Please install tex (via MiKTeX) to continue"
    exit
fi

# Check if Node.js is installed, if not, install it
if ! command -v node &>/dev/null; then
    echo "Node.js not found, installing..."
    brew install node
fi

# Define the source file, target directory, and symlink name
VERSION="0.0.7"
SOURCE_FILE="jtex.sh"
TARGET_DIR="/usr/local/lib/jtex/v$VERSION"
SYMLINK_NAME="jtex"

# Create the target directory if it doesn't exist
mkdir -p $TARGET_DIR

if [ $? -ne 0 ] ; then
    echo "Could not create the target $TARGET_DIR. Try to run the script with elevated permissions"
    exit
fi

# Copy the script to the target directory
# cp $SOURCE_FILE $TARGET_DIR
npm install
npm update
node ./dosetup.js $TARGET_DIR

# Create a symlink in /usr/local/bin to call your script from any directory
ln -sf $TARGET_DIR/$SOURCE_FILE /usr/local/bin/$SYMLINK_NAME

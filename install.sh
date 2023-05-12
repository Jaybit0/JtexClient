#!/bin/bash

# Check if the script has elevated permissions
if [ "$EUID" -ne 0 ]; then
  echo "Please run the script with elevated permissions (e.g., sudo)."
  exit
fi

pid=$1
platform=$(uname)

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
    if [ "$platform" = "Darwin" ]; then
        brew install node
    elif [ "$platform" = "Linux" ]; then
        curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "Unsupported platform, please install Node.js manually."
        exit
    fi
fi

# Check if npm is installed, if not, install it
if ! command -v npm &>/dev/null; then
    echo "npm not found, installing..."
    if [ "$platform" = "Darwin" ]; then
        brew install npm
    elif [ "$platform" = "Linux" ]; then
        sudo apt-get install -y npm
    else
        echo "Unsupported platform, please install npm manually."
        exit
    fi
fi

# Update npm to the latest version
echo "Updating npm to the latest version..."
if [ "$platform" = "Darwin" ]; then
    sudo npm install -g npm
elif [ "$platform" = "Linux" ]; then
    sudo npm install -g npm
else
    echo "Unsupported platform, please update npm manually."
    exit
fi

# Define the source file, target directory, and symlink name
VERSION="0.0.8"
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
sudo ln -sf $TARGET_DIR/$SOURCE_FILE /usr/local/bin/$SYMLINK_NAME
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR"

IMAGE_BASE="jtexclient"
PREFIX="/usr/local"
BUILD_IMAGE=1

show_help() {
    cat <<'USAGE'
Usage: install-docker.sh [options]

Options:
  --image NAME    Base name for the Docker image tag (default: jtexclient)
  --prefix PATH   Installation prefix (default: /usr/local)
  --no-build      Skip docker build (fails if image/tag not present)
  -h, --help      Show this help message
USAGE
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --image)
            [ $# -ge 2 ] || { echo "Missing value for --image" >&2; exit 1; }
            IMAGE_BASE="$2"
            shift 2
            ;;
        --prefix)
            [ $# -ge 2 ] || { echo "Missing value for --prefix" >&2; exit 1; }
            PREFIX="$2"
            shift 2
            ;;
        --no-build)
            BUILD_IMAGE=0
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            show_help >&2
            exit 1
            ;;
    esac
done

if ! command -v docker >/dev/null 2>&1; then
    echo "Docker CLI not found. Install Docker before running this installer." >&2
    exit 127
fi

LIB_DIR="$PREFIX/lib/jtex"
BIN_DIR="$PREFIX/bin"

if ! mkdir -p "$LIB_DIR" "$BIN_DIR" >/dev/null 2>&1; then
    echo "Unable to create $LIB_DIR or $BIN_DIR. Re-run with elevated permissions or choose a writable --prefix." >&2
    exit 1
fi

VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"[:space:]]*\)".*/\1/p' "$REPO_DIR/package.json" | head -n 1)
if [ -z "$VERSION" ]; then
    echo "Unable to determine application version from package.json." >&2
    exit 1
fi

VERSION_TAG="$IMAGE_BASE:$VERSION"
LATEST_TAG="$IMAGE_BASE:latest"

if [ "$BUILD_IMAGE" -eq 1 ]; then
    docker build -t "$VERSION_TAG" -t "$LATEST_TAG" "$REPO_DIR"
else
    if ! docker image inspect "$VERSION_TAG" >/dev/null 2>&1 && ! docker image inspect "$LATEST_TAG" >/dev/null 2>&1; then
        echo "Requested to skip build, but neither $VERSION_TAG nor $LATEST_TAG exists." >&2
        exit 1
    fi
fi

install -m 755 "$REPO_DIR/jtex-docker.sh" "$LIB_DIR/jtex-docker.sh"
if [ -f "$REPO_DIR/jtex-docker.bat" ]; then
    install -m 755 "$REPO_DIR/jtex-docker.bat" "$LIB_DIR/jtex-docker.bat"
fi
printf '%s\n' "$VERSION_TAG" > "$LIB_DIR/docker-image"

ln -sf "$LIB_DIR/jtex-docker.sh" "$BIN_DIR/jtex"
if [ -f "$LIB_DIR/jtex-docker.bat" ]; then
    ln -sf "$LIB_DIR/jtex-docker.bat" "$BIN_DIR/jtex.bat"
fi

echo "Docker image built and tagged as $VERSION_TAG (also tagged latest)."
echo "CLI wrapper installed to $BIN_DIR/jtex."
echo "Use 'jtex help' to verify the installation."

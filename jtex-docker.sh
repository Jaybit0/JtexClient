#!/bin/bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
    echo "Error: Docker CLI not found. Install Docker to run JTeX in a container." >&2
    exit 127
fi

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
    DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
SCRIPT_DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"

CONFIG_FILE="$SCRIPT_DIR/docker-image"
DEFAULT_IMAGE="jtexclient:latest"

IMAGE_NAME="${JTEX_DOCKER_IMAGE:-}"
if [ -z "$IMAGE_NAME" ] && [ -f "$CONFIG_FILE" ]; then
    IMAGE_NAME="$(tr -d '\r\n' < "$CONFIG_FILE")"
fi
if [ -z "$IMAGE_NAME" ]; then
    IMAGE_NAME="$DEFAULT_IMAGE"
fi
if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
    echo "Error: Docker image '$IMAGE_NAME' not found. Run install-docker.sh or set JTEX_DOCKER_IMAGE." >&2
    exit 125
fi

USER_ID="${JTEX_DOCKER_UID:-$(id -u)}"
GROUP_ID="${JTEX_DOCKER_GID:-$(id -g)}"
USER_NAME="${JTEX_DOCKER_USER:-$(id -un 2>/dev/null || echo jtex)}"
HOME_DIR="${JTEX_DOCKER_HOME:-${HOME:-/tmp}}"
WORKDIR="$(pwd -P)"

DOCKER_CMD=(
    docker run --rm
    --init
    -u "${USER_ID}:${GROUP_ID}"
    -e "HOME=${HOME_DIR}"
    -e "USER=${USER_NAME}"
    -e JTEX_CONTAINERIZED=1
    -v "${HOME_DIR}:${HOME_DIR}"
    -v "${WORKDIR}:${WORKDIR}"
    -w "${WORKDIR}"
)

if [ -n "${JTEX_DOCKER_EXTRA_VOLUMES:-}" ]; then
    while IFS= read -r volume; do
        [ -n "$volume" ] || continue
        DOCKER_CMD+=(-v "$volume")
    done <<< "$JTEX_DOCKER_EXTRA_VOLUMES"
fi

if [ -n "${JTEX_DOCKER_ENV:-}" ]; then
    while IFS= read -r var; do
        [ -n "$var" ] || continue
        DOCKER_CMD+=(-e "$var")
    done <<< "$JTEX_DOCKER_ENV"
fi

DOCKER_CMD+=("$IMAGE_NAME")
if [ "$#" -gt 0 ]; then
    DOCKER_CMD+=("$@")
fi

exec "${DOCKER_CMD[@]}"

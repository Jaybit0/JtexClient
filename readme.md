# JTeX

JTeX is a sophisticated high-level language designed to simplify and enhance the process of creating PDF files. It introduces a set of new syntax elements designed to streamline your workflow, while fully maintaining compatibility with traditional LaTeX code. This means you can write in LaTeX within JTeX, and your code will remain untouched by the compiler, establishing JTeX as an exceptional extension to LaTeX.

The real power of JTeX lies in its dedicated JTeX Client, which enables seamless conversion of `.jtex` files to `.tex` files. Furthermore, it offers automatic conversion of these files to PDF format, making document creation more straightforward than ever.

## System Requirements

JTeX currently supports the following operating systems:

- Windows
- macOS (Darwin)
- Linux

## Docker Support

If you prefer not to install a local TeX distribution, build the provided Docker image and keep using the `jtex` command normally.

### macOS / Linux

1. Make sure Docker Desktop (or another Docker engine) is running.
2. From the repository root execute `sudo ./install-docker.sh`.
3. Run `jtex help` to confirm the wrapper is available on your PATH.

The installer builds the image (tagged `jtexclient:<version>` and `jtexclient:latest`) and installs a lightweight wrapper at `/usr/local/bin/jtex`. The wrapper mounts your home directory so files in `~/.jtex` persist between runs and executes the containerised CLI with your user ID to avoid root-owned artefacts.

To update the container simply rerun `sudo ./install-docker.sh`; the script will rebuild and retag the image. Inside the container the `update` and `upgrade` commands are disabled because updates are intended to happen through the image rebuild.

#### Advanced configuration

- Set `JTEX_DOCKER_IMAGE` to point to a custom image tag.
- Populate `JTEX_DOCKER_EXTRA_VOLUMES` with additional bind mounts (one per line, e.g. `/data:/data`).
- Populate `JTEX_DOCKER_ENV` with additional environment variables (one per line, e.g. `KEY=value`).

### Windows

Windows users can either run the Linux installer from WSL or copy `jtex-docker.bat` somewhere on the PATH and execute it directly. The batch script expects the Docker image to exist (build it with `docker build -t jtexclient .`). It mounts the current working directory at `/workspace` and the user profile at `/host-home` before delegating to the containerised CLI.

## Prerequisites

The prerequisites below apply to the native installation path. When using the Docker workflow the TeX distribution and Node.js runtime are bundled inside the container.

Before you begin the native installation process, ensure that MikTex is installed on your system, and the terminal can recognise the command pdflatex. If you haven't installed it already, you can download it from the official [MikTex website](https://miktex.org/download).

## Installation

The installation process varies depending on your operating system.

### For Windows:
1. Navigate to the directory containing the `setup.bat` file in the command prompt.
2. Execute the script by typing `setup.bat` and pressing `Enter`.
3. After the script has finished running, restart your computer to update the system path variables.

### For macOS:
1. Open a terminal window.
2. Navigate to the directory containing the install.sh file using the cd command.
3. Execute the script by typing `./install.sh` and pressing Enter.

## Usage

After installation, you can run JTeX by typing `jtex [help]` in the terminal or command prompt.

## Contributing

We welcome contributions from the community. If you wish to contribute, please take a look at our contributing guidelines.

## License

JTeX is licensed under the MIT License.

## Contact

If you have any questions, issues, or feedback, please open an issue on this repository.

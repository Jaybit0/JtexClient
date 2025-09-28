@echo off
setlocal

set "IMAGE=%JTEX_DOCKER_IMAGE%"
set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%docker-image" (
    set /p IMAGE=<"%SCRIPT_DIR%docker-image"
)
if "%IMAGE%"=="" set "IMAGE=jtexclient:latest"

where docker >nul 2>&1
if errorlevel 1 (
    echo Error: Docker CLI not found. Install Docker Desktop to run JTeX in a container.>&2
    exit /b 127
)

docker image inspect %IMAGE% >nul 2>&1
if errorlevel 1 (
    echo Error: Docker image "%IMAGE%" not found. Run install-docker.bat or set JTEX_DOCKER_IMAGE.>&2
    exit /b 125
)

set "WORKDIR=%cd%"
set "WORKDIR_LINUX=/workspace"
if not "%JTEX_DOCKER_WORKDIR%"=="" set "WORKDIR_LINUX=%JTEX_DOCKER_WORKDIR%"

set "HOME_DIR=%USERPROFILE%"
set "HOME_LINUX=/host-home"
if not "%JTEX_DOCKER_HOME%"=="" set "HOME_DIR=%JTEX_DOCKER_HOME%"

set "DOCKER_CMD=docker run --rm --init"
set "DOCKER_CMD=%DOCKER_CMD% -e HOME=%HOME_LINUX%"
set "DOCKER_CMD=%DOCKER_CMD% -e USER=%USERNAME%"
set "DOCKER_CMD=%DOCKER_CMD% -e JTEX_CONTAINERIZED=1"
set "DOCKER_CMD=%DOCKER_CMD% -v \"%HOME_DIR%:%HOME_LINUX%\""
set "DOCKER_CMD=%DOCKER_CMD% -v \"%WORKDIR%:%WORKDIR_LINUX%\""
set "DOCKER_CMD=%DOCKER_CMD% -w %WORKDIR_LINUX%"

if not "%JTEX_DOCKER_EXTRA_VOLUMES%"=="" (
    for %%V in (%JTEX_DOCKER_EXTRA_VOLUMES%) do (
        set "DOCKER_CMD=%DOCKER_CMD% -v %%V"
    )
)

if not "%JTEX_DOCKER_ENV%"=="" (
    for %%E in (%JTEX_DOCKER_ENV%) do (
        set "DOCKER_CMD=%DOCKER_CMD% -e %%E"
    )
)

set "DOCKER_CMD=%DOCKER_CMD% %IMAGE%"

%DOCKER_CMD% %*

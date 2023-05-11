@echo off

rem Get the process ID from the command line argument
set "PID=%1"

rem Check if a process ID was provided as an argument
IF NOT "%PID%"=="" (
  rem Kill the process with the specified process ID
  echo Killing process with PID %PID%
  taskkill /F /PID %PID%

  rem Add a small delay to ensure the process is terminated
  timeout /t 1 /nobreak >nul
)

npm install && npm update && node %~dp0dosetup.js %*
pause
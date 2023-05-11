@echo off

rem Check if a process ID was provided as an argument
IF NOT "%1"=="" (
  rem Get the process ID from the command line argument
  set pid=%1

  rem Kill the process with the specified process ID
  echo Killing process with PID %pid%
  taskkill /F /PID %pid%

  rem Add a small delay to ensure the process is terminated
  timeout /t 1 /nobreak >nul
)

npm install && npm update && node %~dp0dosetup.js %*
pause
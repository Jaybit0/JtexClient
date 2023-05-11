@echo off

rem Add a small delay to ensure the process is terminated
timeout /t 1 /nobreak >nul

npm install && npm update && node %~dp0dosetup.js %*
pause
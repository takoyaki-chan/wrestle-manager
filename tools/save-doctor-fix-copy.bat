@echo off
setlocal
cd /d "%~dp0"

if not exist "%~dp0save-doctor.js" (
  echo.
  echo Save Doctor files were not found in the tools folder.
  echo Please keep this BAT inside the wrestle-manager\tools folder.
  echo Do not copy this BAT into your save-data folder.
  echo.
  pause
  exit /b 1
)

set "SAVE_FILE=%~1"
if "%SAVE_FILE%"=="" (
  echo.
  echo Save Doctor - Safe Repair Copy
  echo.
  echo Drag and drop your save file onto this BAT.
  echo Or paste the full save-file path and press Enter.
  echo.
  set /p SAVE_FILE=Save file path:
)

if "%SAVE_FILE%"=="" (
  echo.
  echo No save file was provided.
  pause
  exit /b 1
)

if not exist "%SAVE_FILE%" (
  echo.
  echo The specified file was not found.
  echo %SAVE_FILE%
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found.
  pause
  exit /b 1
)

for %%I in ("%SAVE_FILE%") do (
  set "SAVE_DIR=%%~dpI"
  set "SAVE_NAME=%%~nI"
  set "SAVE_EXT=%%~xI"
)

set "OUTPUT_FILE=%SAVE_DIR%%SAVE_NAME%.fixed%SAVE_EXT%"
set "REPORT_FILE=%SAVE_DIR%%SAVE_NAME%.doctor-fix.txt"

echo.
echo Running repair...
echo Repaired save:
echo %OUTPUT_FILE%
echo.

(
  echo Save Doctor Repair Report
  echo.
  echo Target file:
  echo %SAVE_FILE%
  echo.
  echo Repaired file:
  echo %OUTPUT_FILE%
  echo.
  node "%~dp0save-doctor.js" "%SAVE_FILE%" --repair --output "%OUTPUT_FILE%"
) > "%REPORT_FILE%" 2>&1

start "" notepad "%REPORT_FILE%"

echo.
echo The repair report was opened in Notepad.
pause

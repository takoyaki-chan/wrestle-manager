@echo off
setlocal
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js が見つかりません。Node.js をインストールしてください。
  echo.
  pause
  exit /b 1
)

echo ================================================
echo  セリフを Excel に書き出します
echo ================================================
echo.
echo ※ 編集中の Excel は先に閉じてください。
echo.
node tools\dialogue-workbook.js export
echo.
echo 書き出しが終わりました。このフォルダの xlsx を開いて編集してください。
echo.
pause

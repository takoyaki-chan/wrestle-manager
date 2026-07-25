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
echo  変更内容の確認 ^(まだ反映しません^)
echo ================================================
echo.
node tools\dialogue-workbook.js apply --dry-run
echo.
echo 上の内容でよければ「3_ゲームに反映.bat」を実行してください。
echo.
pause

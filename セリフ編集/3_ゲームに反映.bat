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
echo  Excel の「改訂」列をゲームに反映します
echo ================================================
echo.
echo ※ 反映後に自動でテストが走ります。失敗した場合は自動で元に戻します。
echo.
choice /c YN /n /m "反映してよろしいですか? (Y=はい / N=やめる) "
if errorlevel 2 (
  echo.
  echo 中止しました。何も変更していません。
  echo.
  pause
  exit /b 0
)
echo.
node tools\dialogue-workbook.js apply
echo.
pause

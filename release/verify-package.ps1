# WRESTLE MANAGER — 配布パッケージ検証スクリプト
# 使い方:
#   .\release\verify-package.ps1 -ZipPath .\release\dist\WrestleManager_1.07.zip
#
# 処理内容:
#   1. zip を release\verify-tmp\ に解凍
#   2. manifest.json と突き合わせてファイル完全性を検証
#   3. Python or Node で HTTP サーバーを起動
#   4. ブラウザで開いて手動チェックリストを表示
#   5. Enter 入力で HTTP サーバー停止 + verify-tmp\ 削除
#
# 要件: Windows PowerShell 5.1 以降

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ZipPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── パス解決 ─────────────────────────────────────────────────────────────────
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir   = Split-Path -Parent $ScriptDir
$ManifestPath = Join-Path $ScriptDir "manifest.json"
$VerifyTmp    = Join-Path $ScriptDir "verify-tmp"
$ZipPath      = Resolve-Path $ZipPath

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  WRESTLE MANAGER — パッケージ検証" -ForegroundColor Cyan
Write-Host "  対象: $(Split-Path -Leaf $ZipPath)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ── manifest.json 読み込み ────────────────────────────────────────────────────
if (-not (Test-Path $ManifestPath)) {
    Write-Error "manifest.json が見つかりません: $ManifestPath"
    exit 1
}
$Manifest = Get-Content $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json

# ── 解凍 ──────────────────────────────────────────────────────────────────────
Write-Host "[1/3] 解凍中..." -ForegroundColor Yellow

if (Test-Path $VerifyTmp) {
    Remove-Item -Recurse -Force $VerifyTmp
}
New-Item -ItemType Directory -Path $VerifyTmp | Out-Null

Expand-Archive -Path $ZipPath -DestinationPath $VerifyTmp -Force

# 解凍されたパッケージフォルダを特定（zip内の最上位フォルダ）
$PackageDir = Get-ChildItem -Path $VerifyTmp -Directory | Select-Object -First 1
if (-not $PackageDir) {
    Write-Host "ERROR: zip 内にフォルダが見つかりません。" -ForegroundColor Red
    exit 1
}
$PackageRoot = $PackageDir.FullName
Write-Host "  ✓ 解凍先: $PackageRoot" -ForegroundColor Green

# ── ファイル完全性検証 ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/3] ファイル完全性検証中..." -ForegroundColor Yellow

$Errors   = @()
$Warnings = @()

# sourceFiles
foreach ($f in $Manifest.sourceFiles) {
    $FullPath = Join-Path $PackageRoot $f
    if (-not (Test-Path $FullPath)) {
        $Errors += "MISSING: $f"
    }
}

# rootFiles
foreach ($f in $Manifest.rootFiles) {
    $FullPath = Join-Path $PackageRoot $f
    if (-not (Test-Path $FullPath)) {
        $Errors += "MISSING: $f"
    }
}

# 生成ファイル
foreach ($f in @("START.html", "README.txt")) {
    $FullPath = Join-Path $PackageRoot $f
    if (-not (Test-Path $FullPath)) {
        $Warnings += "WARNING: 生成ファイルが見つかりません: $f"
    }
}

# アセットディレクトリ
foreach ($d in $Manifest.assetDirectories) {
    $FullPath = Join-Path $PackageRoot $d
    if (-not (Test-Path $FullPath -PathType Container)) {
        $Errors += "MISSING DIR: $d/"
    }
}

if ($Errors.Count -gt 0) {
    Write-Host ""
    Write-Host "  ✗ 検証失敗 — 以下のファイルが zip に含まれていません:" -ForegroundColor Red
    foreach ($e in $Errors) {
        Write-Host "    $e" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "  package-release.ps1 を再実行し、manifest.json を確認してください。" -ForegroundColor Red
    Remove-Item -Recurse -Force $VerifyTmp
    exit 1
}

foreach ($w in $Warnings) {
    Write-Host "  $w" -ForegroundColor Yellow
}

$TotalExpected = $Manifest.sourceFiles.Count + $Manifest.rootFiles.Count
Write-Host "  ✓ $TotalExpected ファイル + $($Manifest.assetDirectories.Count) アセットディレクトリ — すべて確認" -ForegroundColor Green

# ── HTTP サーバー起動 ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] HTTP サーバーを起動してブラウザ確認..." -ForegroundColor Yellow

$ServerProcess = $null
$Port = 8080

# Python を優先、なければ Node を使用
$PythonPath = $null
$NodePath   = $null

try { $PythonPath = (Get-Command python -ErrorAction Stop).Source } catch {}
try { $NodePath   = (Get-Command node   -ErrorAction Stop).Source } catch {}

if ($PythonPath) {
    Write-Host "  Python HTTP サーバーを起動中 (port $Port)..." -ForegroundColor Cyan
    $ServerProcess = Start-Process -FilePath $PythonPath `
        -ArgumentList "-m", "http.server", $Port `
        -WorkingDirectory $PackageRoot `
        -PassThru -WindowStyle Minimized
} elseif ($NodePath) {
    Write-Host "  Node http-server を起動中 (port $Port)..." -ForegroundColor Cyan
    $ServerProcess = Start-Process -FilePath $NodePath `
        -ArgumentList (Join-Path $ProjectDir "node_modules\.bin\http-server"), ".", "-p", $Port, "-c-1" `
        -WorkingDirectory $PackageRoot `
        -PassThru -WindowStyle Minimized
} else {
    Write-Host "  WARNING: Python / Node が見つかりません。" -ForegroundColor Yellow
    Write-Host "  手動で $PackageRoot を HTTP サーバーで配信してください。" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

$BrowserUrl = "http://localhost:$Port/START.html"
Write-Host "  ブラウザで開きます: $BrowserUrl" -ForegroundColor Cyan
Start-Process $BrowserUrl

# ── 手動チェックリスト ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  手動チェックリスト（ブラウザで確認してください）" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  [ ] タイトル画面が正常に表示される" -ForegroundColor White
Write-Host "  [ ] 新規ゲームを開始できる" -ForegroundColor White
Write-Host "  [ ] 第1週の「週を処理」ボタンを押して第2週に進める  ← 最重要" -ForegroundColor Yellow
Write-Host "  [ ] F12 コンソールに赤エラーが出ていない" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""
Write-Host "  確認が終わったら Enter を押してください。" -ForegroundColor Cyan
Write-Host "  （HTTP サーバーを停止し verify-tmp/ を削除します）" -ForegroundColor Gray
Write-Host ""

Read-Host "Enter を押して終了"

# ── クリーンアップ ────────────────────────────────────────────────────────────
if ($ServerProcess -and -not $ServerProcess.HasExited) {
    Stop-Process -Id $ServerProcess.Id -Force
    Write-Host "  HTTP サーバーを停止しました。" -ForegroundColor Gray
}

Remove-Item -Recurse -Force $VerifyTmp
Write-Host "  verify-tmp/ を削除しました。" -ForegroundColor Gray
Write-Host ""
Write-Host "  検証完了。" -ForegroundColor Green
Write-Host ""

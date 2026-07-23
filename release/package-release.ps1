# WRESTLE MANAGER — 配布パッケージ作成スクリプト
# 使い方:
#   .\release\package-release.ps1
#   .\release\package-release.ps1 -Version 1.08
#   .\release\package-release.ps1 -Version 1.08 -Force
#
# -Version : バージョン番号（省略時は manifest.json の version を使用）
# -Force   : 既存 zip を確認なしに上書き
#
# 要件: Windows PowerShell 5.1 以降

[CmdletBinding()]
param(
    [string]$Version = "",
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── パス解決 ─────────────────────────────────────────────────────────────────
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$ManifestPath = Join-Path $ScriptDir "manifest.json"

# ── manifest.json 読み込み ────────────────────────────────────────────────────
if (-not (Test-Path $ManifestPath)) {
    Write-Error "manifest.json が見つかりません: $ManifestPath"
    exit 1
}
$Manifest = Get-Content $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json

if (-not $Version) {
    $Version = $Manifest.version
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  WRESTLE MANAGER — 配布パッケージ作成" -ForegroundColor Cyan
Write-Host "  Version: $Version" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ── ファイル存在検証 ──────────────────────────────────────────────────────────
Write-Host "[1/5] ファイル存在検証中..." -ForegroundColor Yellow

$MissingFiles = @()

foreach ($f in $Manifest.sourceFiles) {
    $FullPath = Join-Path $ProjectDir $f
    if (-not (Test-Path $FullPath)) {
        $MissingFiles += $f
    }
}

foreach ($f in $Manifest.rootFiles) {
    $FullPath = Join-Path $ProjectDir $f
    if (-not (Test-Path $FullPath)) {
        $MissingFiles += $f
    }
}

foreach ($d in $Manifest.assetDirectories) {
    $FullPath = Join-Path $ProjectDir $d
    if (-not (Test-Path $FullPath -PathType Container)) {
        $MissingFiles += "$d/ (ディレクトリ)"
    }
}

if ($MissingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "ERROR: 以下のファイルが存在しません。manifest.json を確認してください。" -ForegroundColor Red
    foreach ($f in $MissingFiles) {
        Write-Host "  ✗ $f" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
}

Write-Host "  ✓ 全 $($Manifest.sourceFiles.Count + $Manifest.rootFiles.Count) ファイル + $($Manifest.assetDirectories.Count) ディレクトリ 確認完了" -ForegroundColor Green

# ── manifest 未記載の src/ JS/CSS ファイルを警告 ─────────────────────────────
$SrcDir = Join-Path $ProjectDir "src"
$ActualSrcFiles = Get-ChildItem -Path $SrcDir -Include "*.js","*.css","*.html" -File |
    ForEach-Object { "src/" + $_.Name }
$ManifestSrcSet = [System.Collections.Generic.HashSet[string]]($Manifest.sourceFiles)
$Uncovered = $ActualSrcFiles | Where-Object { -not $ManifestSrcSet.Contains($_) }

if ($Uncovered) {
    Write-Host ""
    Write-Host "WARNING: 以下のファイルは src/ に存在しますが manifest.json に記載がありません。" -ForegroundColor Yellow
    Write-Host "         新規追加ファイルなら manifest.json に追加してください。" -ForegroundColor Yellow
    foreach ($f in $Uncovered) {
        Write-Host "  ! $f" -ForegroundColor Yellow
    }
}

# ── 出力先チェック ────────────────────────────────────────────────────────────
$DistDir = Join-Path $ScriptDir "dist"
$ZipName = "WrestleManager_$Version.zip"
$ZipPath = Join-Path $DistDir $ZipName

if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir | Out-Null
}

if ((Test-Path $ZipPath) -and (-not $Force)) {
    Write-Host ""
    $Answer = Read-Host "出力先 '$ZipName' が既に存在します。上書きしますか？ [y/N]"
    if ($Answer -notmatch '^[Yy]') {
        Write-Host "中断しました。" -ForegroundColor Yellow
        exit 0
    }
}

# ── ステージング ──────────────────────────────────────────────────────────────
$PackageName = "WrestleManager_$Version"
$StagingRoot = Join-Path $ScriptDir "staging"
$StagingDir  = Join-Path $StagingRoot $PackageName

Write-Host ""
Write-Host "[2/5] ステージングフォルダを準備中..." -ForegroundColor Yellow

if (Test-Path $StagingRoot) {
    Remove-Item -Recurse -Force $StagingRoot
}
New-Item -ItemType Directory -Path (Join-Path $StagingDir "src") | Out-Null

# src/ ファイルをコピー
foreach ($f in $Manifest.sourceFiles) {
    $Src  = Join-Path $ProjectDir $f
    $Dest = Join-Path $StagingDir $f
    Copy-Item $Src $Dest
}

# ルートファイルをコピー
foreach ($f in $Manifest.rootFiles) {
    $Src  = Join-Path $ProjectDir $f
    $Dest = Join-Path $StagingDir $f
    Copy-Item $Src $Dest
}

Write-Host "  ✓ src/ $($Manifest.sourceFiles.Count) ファイル + $($Manifest.rootFiles.Count) ルートファイル コピー完了" -ForegroundColor Green

# ── アセットディレクトリをコピー ──────────────────────────────────────────────
Write-Host ""
Write-Host "[3/5] アセットをコピー中（image/, bgm/ — 数分かかる場合があります）..." -ForegroundColor Yellow

foreach ($d in $Manifest.assetDirectories) {
    $Src  = Join-Path $ProjectDir $d
    $Dest = Join-Path $StagingDir $d
    Copy-Item -Recurse $Src $Dest
    # 開発用ファイルを配布物から除外（ローカル試聴ツール・音声編集の作業ファイル等）
    $DevPatterns = @('audio-mixer.html', '*.aup3', '*.wav')
    foreach ($pat in $DevPatterns) {
        Get-ChildItem -Recurse -File $Dest -Filter $pat -ErrorAction SilentlyContinue | Remove-Item -Force
    }
    $Count = (Get-ChildItem -Recurse -File $Dest).Count
    Write-Host "  ✓ $d/ ($Count ファイル)" -ForegroundColor Green
}

# ── 生成ファイル ──────────────────────────────────────────────────────────────
$StartHtml = @'
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=src/index.html"><title>Wrestle Manager</title></head>
<body style="background:#1a1a2e;color:#eee;font-family:sans-serif;text-align:center;padding-top:100px">
<p>ゲームを起動中...</p><p><a href="src/index.html" style="color:#e8439f">クリックしても開かない場合はここをクリック</a></p>
</body></html>
'@

$ReadmeTxt = @"
Wrestle Manager v$Version

【遊び方】
START.html をブラウザ（Chrome/Edge推奨）でダブルクリックしてください。
インストール不要です。

※ START.html で開かない場合は src/index.html を直接開いてください。

【ガイド】
ガイド01-はじめの一歩.html … 初心者向けのスタートガイド
ガイド02-さらに先へ.html   … 慣れてきた人向けの発展ガイド
ガイド03-パラメータ解説.html … ステータス・システム解説ガイド

© takoyaki-chan
"@

[System.IO.File]::WriteAllText((Join-Path $StagingDir "START.html"), $StartHtml, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText((Join-Path $StagingDir "README.txt"), $ReadmeTxt, [System.Text.Encoding]::UTF8)
Write-Host "  ✓ START.html / README.txt 生成" -ForegroundColor Green

# ── ファイル数・サイズ集計 ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/5] ステージング集計..." -ForegroundColor Yellow

$AllFiles = Get-ChildItem -Recurse -File $StagingDir
$TotalCount = $AllFiles.Count
$TotalBytes = ($AllFiles | Measure-Object -Property Length -Sum).Sum
$TotalMB = [Math]::Round($TotalBytes / 1MB, 1)

Write-Host "  ファイル総数: $TotalCount 個" -ForegroundColor Cyan
Write-Host "  合計サイズ:   $TotalMB MB" -ForegroundColor Cyan

# ── ZIP 作成 ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] ZIP 作成中..." -ForegroundColor Yellow

if (Test-Path $ZipPath) {
    Remove-Item -Force $ZipPath
}

Compress-Archive -Path $StagingDir -DestinationPath $ZipPath

$ZipMB = [Math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
Write-Host "  ✓ $ZipName ($ZipMB MB)" -ForegroundColor Green

# ── ステージング削除 ──────────────────────────────────────────────────────────
Remove-Item -Recurse -Force $StagingRoot

# ── 完了 ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  完了: $ZipPath" -ForegroundColor Green
Write-Host "  次のステップ: .\release\verify-package.ps1 -ZipPath '$ZipPath'" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

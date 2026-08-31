# WRESTLE MANAGER — 配布パッケージ作成スクリプト
# 使い方:
#   .\release\package-release.ps1
#   .\release\package-release.ps1 -Version 1.08
#   .\release\package-release.ps1 -Version 1.08 -Force
#   .\release\package-release.ps1 -Version 1.08 -Trial -Force
#
# -Version : バージョン番号（省略時は manifest.json の version を使用）
# -Trial   : 3シーズンまでプレイできる体験版として梱包
# -Force   : 既存 zip を確認なしに上書き
#
# 要件: Windows PowerShell 5.1 以降

[CmdletBinding()]
param(
    [string]$Version = "",
    [switch]$Trial,
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

# devOnlyFiles: 配布に含めない開発専用ファイル（manifest に無くても警告しない／HTML から参照を除去する）
$DevOnlyFiles = @()
if ($Manifest.PSObject.Properties['devOnlyFiles']) {
    $DevOnlyFiles = @($Manifest.devOnlyFiles)
}

# sourceFiles と devOnlyFiles の両方に載っているのは矛盾（配布する気なのか除外する気なのか不明）
$Contradictory = $DevOnlyFiles | Where-Object { $Manifest.sourceFiles -contains $_ }
if ($Contradictory) {
    Write-Host ""
    Write-Host "ERROR: 以下のファイルが sourceFiles と devOnlyFiles の両方に記載されています。" -ForegroundColor Red
    foreach ($f in $Contradictory) {
        Write-Host "  ✗ $f" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
}

if (-not $Version) {
    $Version = $Manifest.version
}

$EditionName = "製品版"
$FileSuffix  = ""
if ($Trial) {
    $EditionName = "体験版（3シーズン）"
    $FileSuffix  = "_Trial"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  WRESTLE MANAGER — 配布パッケージ作成" -ForegroundColor Cyan
Write-Host "  Version: $Version" -ForegroundColor Cyan
Write-Host "  Mode: $EditionName" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ── 出荷元のGit状態 ───────────────────────────────────────────────────────────
# 未コミットのまま梱包すると、出荷物と復元可能な履歴が一致しなくなる。
# 完了済みコミットからだけ配布物を作る。
Write-Host "[1/7] 出荷元のGit状態を確認中..." -ForegroundColor Yellow
$GitCommand = Get-Command git -ErrorAction SilentlyContinue
if (-not $GitCommand) {
    Write-Host "ERROR: Git が見つかりません。出荷元がコミット済みか確認できないため梱包を中止します。" -ForegroundColor Red
    exit 1
}
$WorkingTreeChanges = @(& $GitCommand.Source -C $ProjectDir status --short)
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git状態を確認できません。梱包を中止します。" -ForegroundColor Red
    exit 1
}
if ($WorkingTreeChanges.Count -gt 0) {
    Write-Host "ERROR: 未コミット変更があります。出荷物とGit履歴を一致させるため、対象変更をコミットしてから梱包してください。" -ForegroundColor Red
    $WorkingTreeChanges | ForEach-Object { Write-Host "  ! $_" -ForegroundColor Red }
    exit 1
}
Write-Host "  ✓ 作業ツリーはクリーン" -ForegroundColor Green

# ── ファイル存在検証 ──────────────────────────────────────────────────────────
# ── 進行不能出荷ゲート ───────────────────────────────────────────────────────
# ZIP を作る前に、通常週・季節イベント・年末処理・保存復帰の各進行経路を検証する。
# この検証が失敗した配布物は回避不能な進行不能につながるため、梱包しない。
Write-Host "[2/7] 進行不能出荷ゲートを実行中..." -ForegroundColor Yellow
$NodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCommand) {
    Write-Host "ERROR: Node.js が見つかりません。進行不能出荷ゲートを実行できないため梱包を中止します。" -ForegroundColor Red
    exit 1
}
& $NodeCommand.Source (Join-Path $ProjectDir "test\release-progression-gate.js")
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: 進行不能出荷ゲートが失敗しました。ZIPは作成していません。" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ 進行不能出荷ゲートを通過" -ForegroundColor Green

# ── ファイル存在検証 ─────────────────────────────────────────────────────────
Write-Host "[3/7] ファイル存在検証中..." -ForegroundColor Yellow

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
# devOnlyFiles は「意図的に配布しない」と宣言済みなので警告対象から外す。
# これで警告に残るのは本当に記載を忘れたファイルだけになる。
$SrcDir = Join-Path $ProjectDir "src"
# 2026-08-31 監査で発覚: PS5.1の Get-ChildItem -Include はパスがワイルドカードで
# 終わらないと常に0件を返し、この警告は実装以来一度も出たことがなかった(死んだ防波堤)。
# `\*` を付けて蘇生し、あわせて WARNING → ERROR に格上げする(未記載ファイルは
# 「配布されない=購入者環境でのみ404になる」即バグなので、警告で流してはいけない)。
$ActualSrcFiles = Get-ChildItem -Path "$SrcDir\*" -Include "*.js","*.css","*.html" -File |
    ForEach-Object { "src/" + $_.Name }
if (-not $ActualSrcFiles -or $ActualSrcFiles.Count -eq 0) {
    Write-Host "ERROR: src/ のファイル列挙が0件です。未記載検査そのものが壊れています(監査ガード)。" -ForegroundColor Red
    exit 1
}
$ManifestSrcSet = [System.Collections.Generic.HashSet[string]]($Manifest.sourceFiles)
$DevOnlySet     = [System.Collections.Generic.HashSet[string]]($DevOnlyFiles)
$Uncovered = $ActualSrcFiles | Where-Object {
    (-not $ManifestSrcSet.Contains($_)) -and (-not $DevOnlySet.Contains($_))
}

if ($Uncovered) {
    Write-Host ""
    Write-Host "ERROR: 以下のファイルは src/ に存在しますが manifest.json に記載がありません。" -ForegroundColor Red
    Write-Host "       新規追加ファイルなら manifest.json の sourceFiles に追加してください。" -ForegroundColor Red
    Write-Host "       配布しない開発専用ファイルなら devOnlyFiles に追加してください。" -ForegroundColor Red
    foreach ($f in $Uncovered) {
        Write-Host "  ! $f" -ForegroundColor Red
    }
    exit 1
}

# devOnlyFiles に載っているのに実体が無い＝除去ルールが古い可能性
$StaleDevOnly = $DevOnlyFiles | Where-Object { -not (Test-Path (Join-Path $ProjectDir $_)) }
if ($StaleDevOnly) {
    Write-Host ""
    Write-Host "WARNING: 以下は devOnlyFiles に記載がありますが実体がありません。" -ForegroundColor Yellow
    Write-Host "         削除済みなら manifest.json の devOnlyFiles からも消してください。" -ForegroundColor Yellow
    foreach ($f in $StaleDevOnly) {
        Write-Host "  ! $f" -ForegroundColor Yellow
    }
}

# ── 出力先チェック ────────────────────────────────────────────────────────────
$DistDir = Join-Path $ScriptDir "dist"
$ZipName = "WrestleManager_$Version$FileSuffix.zip"
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
$PackageName = "WrestleManager_$Version$FileSuffix"
$StagingRoot = Join-Path $ScriptDir "staging"
$StagingDir  = Join-Path $StagingRoot $PackageName

Write-Host ""
Write-Host "[4/7] ステージングフォルダを準備中..." -ForegroundColor Yellow

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

# ── 配布用 HTML から開発専用ファイルへの参照を除去 ────────────────────────────
# devOnlyFiles は zip に入らないため、参照行を残すと製品版で毎回 404 が出る。
# src/ 側は触らない（開発時は従来どおり Ctrl+Shift+D で開発者パネルが開く）。
if ($DevOnlyFiles.Count -gt 0) {
    $StagedHtml = $Manifest.sourceFiles | Where-Object { $_ -like "*.html" }
    $Utf8NoBom  = New-Object System.Text.UTF8Encoding($false)
    $RemovedTotal = 0
    $Residual = @()

    foreach ($rel in $StagedHtml) {
        $Path     = Join-Path $StagingDir $rel
        $Original = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
        $Content  = $Original

        foreach ($dev in $DevOnlyFiles) {
            $Esc = [regex]::Escape((Split-Path -Leaf $dev))

            # ディレクトリ接頭辞（./ や ../src/）だけ許容し、ファイル名の部分一致は拾わない。
            # これで vendor-dev-tools.js のような別ファイルを巻き込まない。
            $Pre = "(?:[^""']*[/\\])?"

            # <script src="dev-tools.js"></script> / <link href="dev-only.css"> の行ごと除去
            $TagPattern = "(?m)^[^\S\r\n]*(?:<script\b[^>]*\bsrc\s*=\s*[""']" + $Pre + $Esc + "[""'][^>]*>\s*</script>" +
                          "|<link\b[^>]*\bhref\s*=\s*[""']" + $Pre + $Esc + "[""'][^>]*>)[^\S\r\n]*\r?\n?"
            $Hits = [regex]::Matches($Content, $TagPattern).Count
            if ($Hits -gt 0) {
                $Content = [regex]::Replace($Content, $TagPattern, "")
                $RemovedTotal += $Hits
                Write-Host "  ✓ $rel から $(Split-Path -Leaf $dev) の参照を $Hits 件除去" -ForegroundColor Green
            }

            # 除去しきれなかった参照が残っていれば 404 になるのでここで止める
            $RefPattern = "(?:src|href)\s*=\s*[""']" + $Pre + $Esc + "[""']"
            if ([regex]::IsMatch($Content, $RefPattern)) {
                $Residual += "$rel -> $dev"
            }
        }

        if ($Content -ne $Original) {
            [System.IO.File]::WriteAllText($Path, $Content, $Utf8NoBom)
        }
    }

    if ($Residual.Count -gt 0) {
        Write-Host ""
        Write-Host "ERROR: 配布用 HTML に開発専用ファイルへの参照が残っています（製品版で 404 になります）。" -ForegroundColor Red
        foreach ($r in $Residual) {
            Write-Host "  ✗ $r" -ForegroundColor Red
        }
        Write-Host ""
        Remove-Item -Recurse -Force $StagingRoot
        exit 1
    }

    if ($RemovedTotal -eq 0) {
        Write-Host "  ! 開発専用ファイルへの参照は HTML 内に見つかりませんでした" -ForegroundColor Yellow
    }
}

# ── 体験版フラグ設定（ステージングのみ。開発元・製品版ソースは変更しない） ────────
if ($Trial) {
    $TrialIndexPath = Join-Path $StagingDir "src/index.html"
    if (-not (Test-Path $TrialIndexPath)) {
        Write-Host "ERROR: 体験版フラグを書き換える src/index.html がありません。" -ForegroundColor Red
        Remove-Item -Recurse -Force $StagingRoot
        exit 1
    }

    $TrialHtml = [System.IO.File]::ReadAllText($TrialIndexPath, [System.Text.Encoding]::UTF8)
    $TrialFlagRegex = New-Object System.Text.RegularExpressions.Regex(
        '(?m)^[^\S\r\n]*window\.IS_TRIAL\s*=\s*false;[^\S\r\n]*\r?$'
    )
    $TrialFlagCount = $TrialFlagRegex.Matches($TrialHtml).Count
    if ($TrialFlagCount -ne 1) {
        Write-Host "ERROR: window.IS_TRIAL=false が1件ではありません（検出: $TrialFlagCount 件）。" -ForegroundColor Red
        Remove-Item -Recurse -Force $StagingRoot
        exit 1
    }
    if (-not [regex]::IsMatch($TrialHtml, '(?m)^[^\S\r\n]*window\.TRIAL_MAX_SEASON\s*=\s*3;[^\S\r\n]*\r?$')) {
        Write-Host "ERROR: 3シーズン制限（TRIAL_MAX_SEASON=3）が見つかりません。" -ForegroundColor Red
        Remove-Item -Recurse -Force $StagingRoot
        exit 1
    }

    $TrialHtml = $TrialFlagRegex.Replace($TrialHtml, '  window.IS_TRIAL = true;', 1)
    $TrialUtf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($TrialIndexPath, $TrialHtml, $TrialUtf8NoBom)
    Write-Host "  ✓ 体験版フラグを有効化（3シーズン終了で進行停止）" -ForegroundColor Green
}

# ── アセットディレクトリをコピー ──────────────────────────────────────────────
Write-Host ""
Write-Host "[5/7] アセットをコピー中（image/, bgm/ — 数分かかる場合があります）..." -ForegroundColor Yellow

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
<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=src/index.html"><title>Wrestle Manager</title><link rel="icon" href="data:,"></head>
<body style="background:#1a1a2e;color:#eee;font-family:sans-serif;text-align:center;padding-top:100px">
<p>ゲームを起動中...</p><p><a href="src/index.html" style="color:#e8439f">クリックしても開かない場合はここをクリック</a></p>
</body></html>
'@

$TrialReadme = ""
if ($Trial) {
    $TrialReadme = @"
【体験版について】
この体験版はシーズン3終了までプレイできます。
シーズン3終了後は週送りが停止しますが、団体や選手データの閲覧は可能です。
手動セーブデータは製品版へそのまま引き継げます。

"@
}

$ReadmeTxt = @"
Wrestle Manager v$Version $EditionName

$TrialReadme

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
Write-Host "[6/7] ステージング集計..." -ForegroundColor Yellow

$AllFiles = Get-ChildItem -Recurse -File $StagingDir
$TotalCount = $AllFiles.Count
$TotalBytes = ($AllFiles | Measure-Object -Property Length -Sum).Sum
$TotalMB = [Math]::Round($TotalBytes / 1MB, 1)

Write-Host "  ファイル総数: $TotalCount 個" -ForegroundColor Cyan
Write-Host "  合計サイズ:   $TotalMB MB" -ForegroundColor Cyan

# ── ZIP 作成 ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[7/7] ZIP 作成中..." -ForegroundColor Yellow

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

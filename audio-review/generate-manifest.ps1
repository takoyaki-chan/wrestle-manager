$ErrorActionPreference = 'Stop'

# audio-review/manifest.js を生成する。
# 走査対象:
#   1. リポジトリ直下の「*BGM*」フォルダ(新候補置き場。再帰、サウンドエフェクト含む)
#   2. リポジトリの bgm/ フォルダ(ゲーム現行音源。比較レーン用)
# 同名ファイルは候補フォルダ側を優先して1件だけ載せる。

$reviewDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoDir = Split-Path -Parent $reviewDir
$extensions = @('.mp3', '.ogg', '.wav', '.m4a', '.flac')

$candidateDir = Get-ChildItem -LiteralPath $repoDir -Directory |
    Where-Object { $_.Name -like '*BGM*' } |
    ForEach-Object {
        $candidate = $_
        $audioCount = @(
            Get-ChildItem -LiteralPath $candidate.FullName -File -Recurse |
                Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() }
        ).Count
        [pscustomobject]@{ FullName = $candidate.FullName; AudioCount = $audioCount }
    } |
    Sort-Object AudioCount -Descending |
    Select-Object -First 1 -ExpandProperty FullName

if (-not $candidateDir) {
    throw 'Audio candidate directory not found.'
}

$scanDirs = New-Object System.Collections.Generic.List[object]
$scanDirs.Add([pscustomobject]@{ Path = $candidateDir; Label = (Split-Path -Leaf $candidateDir); Origin = 'candidates' })

$gameBgmDir = Join-Path $repoDir 'bgm'
if (Test-Path -LiteralPath $gameBgmDir) {
    $scanDirs.Add([pscustomobject]@{ Path = (Get-Item -LiteralPath $gameBgmDir).FullName; Label = 'bgm'; Origin = 'game' })
}

$seenNames = @{}
$items = New-Object System.Collections.Generic.List[object]

foreach ($dir in $scanDirs) {
    $files = Get-ChildItem -LiteralPath $dir.Path -File -Recurse |
        Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() } |
        Sort-Object FullName
    foreach ($file in $files) {
        if ($seenNames.ContainsKey($file.Name)) { continue }
        $seenNames[$file.Name] = $true
        $relative = $file.FullName.Substring($dir.Path.Length + 1).Replace('\', '/')
        $items.Add([ordered]@{
            name = $file.Name
            webkitRelativePath = $relative
            size = $file.Length
            url = '../' + $dir.Label + '/' + $relative
            origin = $dir.Origin
        })
    }
}

$json = ConvertTo-Json -InputObject $items.ToArray() -Depth 4 -Compress
$content = 'window.AUDIO_REVIEW_MANIFEST = ' + $json + ';'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $reviewDir 'manifest.js'), $content, $utf8NoBom)

Write-Output ('Generated manifest for ' + $items.Count + ' audio files (' + ($scanDirs | ForEach-Object { $_.Label }) -join ', ' + ').')

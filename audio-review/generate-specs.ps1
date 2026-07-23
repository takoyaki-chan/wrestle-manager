$ErrorActionPreference = 'Stop'

$reviewDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoDir = Split-Path -Parent $reviewDir
$docsDir = Join-Path $repoDir 'docs'
$catalog = [ordered]@{}

function Get-TableCells([string]$line) {
    return @($line.Trim().Trim('|').Split('|') | ForEach-Object { $_.Trim() })
}

$productionPath = Join-Path $docsDir 'wrestle-manager-audio-production-plan.md'
foreach ($line in Get-Content -LiteralPath $productionPath -Encoding UTF8) {
    if ($line -notmatch '^\|\s*(WM-[A-Z0-9-]+)\s*\|') { continue }
    $cells = Get-TableCells $line
    $id = $cells[0]
    if ($id.StartsWith('WM-SE-') -or $cells.Count -lt 5) { continue }
    $priority = $cells[$cells.Count - 1]
    $current = if ($cells.Count -ge 6) { $cells[4] } else { '' }
    $catalog[$id] = [ordered]@{
        id = $id
        title = $cells[1]
        kind = 'bgm'
        duration = $cells[2]
        usage = ''
        target = $cells[3]
        constraint = ''
        current = $current
        priority = $priority
        source = 'Suno Music'
        prompt = ''
    }
}

$promptPath = Join-Path $docsDir 'wrestle-manager-suno-prompt-pack.md'
$promptLines = @(Get-Content -LiteralPath $promptPath -Encoding UTF8)
for ($i = 0; $i -lt $promptLines.Count; $i++) {
    if ($promptLines[$i] -notmatch '^###\s+(WM-[A-Z0-9-]+)\s+(.+?)\s+\u2014\s+(.+)$') { continue }
    $id = $Matches[1]
    if (-not $catalog.Contains($id)) { continue }
    for ($j = $i + 1; $j -lt [Math]::Min($i + 8, $promptLines.Count); $j++) {
        if ($promptLines[$j] -ne '```text') { continue }
        $parts = New-Object System.Collections.Generic.List[string]
        for ($k = $j + 1; $k -lt $promptLines.Count -and $promptLines[$k] -ne '```'; $k++) {
            $parts.Add($promptLines[$k])
        }
        $catalog[$id].prompt = ($parts -join ' ').Trim()
        break
    }
}

$rolePath = Join-Path $docsDir 'wrestle-manager-audio-role-map.md'
foreach ($line in Get-Content -LiteralPath $rolePath -Encoding UTF8) {
    if ($line -notmatch '^\|\s*(WM-SE-[A-Z0-9]+)\s*\|') { continue }
    $cells = Get-TableCells $line
    if ($cells.Count -lt 7) { continue }
    $id = $cells[0]
    $catalog[$id] = [ordered]@{
        id = $id
        title = $cells[1]
        kind = 'sfx'
        duration = 'short one-shot'
        usage = $cells[2]
        target = ''
        constraint = $cells[3]
        current = ''
        priority = ''
        source = $cells[4]
        prompt = ''
    }
}

$sfxPromptPath = Join-Path $docsDir 'wrestle-manager-suno-sfx-prompt-pack.md'
foreach ($line in Get-Content -LiteralPath $sfxPromptPath -Encoding UTF8) {
    if ($line -notmatch '^\|\s*(WM-SE-[A-Z0-9]+)\s*\|') { continue }
    $id = $Matches[1]
    if (-not $catalog.Contains($id)) { continue }
    if ($line -match '`([^`]+)`') {
        $catalog[$id].prompt = $Matches[1]
    }
}

$items = @($catalog.Values)
$json = $items | ConvertTo-Json -Depth 5 -Compress
$content = 'window.AUDIO_REVIEW_SPECS = ' + $json + ';'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $reviewDir 'specs.js'), $content, $utf8NoBom)

Write-Output ('Generated specs for ' + $items.Count + ' audio cues.')

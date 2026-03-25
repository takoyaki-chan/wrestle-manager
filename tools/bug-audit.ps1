param(
  [ValidateSet("Diff", "Full")]
  [string]$Mode = "Diff",
  [string]$BaseRef = "HEAD~1",
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

function Get-ScanFiles {
  param(
    [string]$ScanMode,
    [string]$Ref
  )

  if ($ScanMode -eq "Full") {
    return Get-ChildItem -Path (Join-Path $repoRoot "src") -Filter *.js -Recurse |
      ForEach-Object { $_.FullName }
  }

  $paths = @()
  $diffFiles = cmd /c "git diff --name-only --diff-filter=ACMRTUXB $Ref -- src package.json 2>nul"
  if ($LASTEXITCODE -eq 0 -and $diffFiles) {
    $paths += $diffFiles
  }

  $untracked = cmd /c "git ls-files --others --exclude-standard -- src 2>nul"
  if ($LASTEXITCODE -eq 0 -and $untracked) {
    $paths += $untracked
  }

  $resolved = @()
  foreach ($path in ($paths | Where-Object { $_ } | Sort-Object -Unique)) {
    $full = Join-Path $repoRoot $path
    if (Test-Path $full) {
      $resolved += (Resolve-Path $full).Path
    }
  }

  if ($resolved.Count -eq 0) {
    return Get-ChildItem -Path (Join-Path $repoRoot "src") -Filter *.js -Recurse |
      ForEach-Object { $_.FullName }
  }

  return $resolved | Sort-Object -Unique
}

function To-RelativePath {
  param([string]$Path)
  if ($Path.StartsWith($repoRoot)) {
    return $Path.Substring($repoRoot.Length).TrimStart('\', '/')
  }
  return $Path
}

$rules = @(
  @{ Id = "week-math"; Pillar = "Week/Season"; Severity = "high"; Pattern = '(\* 52\b|\* 12\b|season \* 12\b|13 - \(G\.week|week > 48|week === 48|week >= 48)'; Why = "Mixed time units are a recurring failure source." },
  @{ Id = "state-migration"; Pillar = "Save/Load"; Severity = "high"; Pattern = '(serialize|deserialize|_migrated_|backward compat|migration)'; Why = "State migrations often preserve outdated assumptions." },
  @{ Id = "roster-movement"; Pillar = "Join/Leave/Transfer"; Severity = "high"; Pattern = '(transfer|retire|retired|freeAgents|rentals|rental|orgJoinWeek|coachAssign|pendingRosterOverflowSigning)'; Why = "Roster movement bugs often leave stale references behind." },
  @{ Id = "season-stats"; Pillar = "Season Transition"; Severity = "medium"; Pattern = '(seasonStats|seasonHistory|fundsHistory|orgPopHistory|peakPop|peakFunds)'; Why = "Season summaries break when one route updates only part of the state." },
  @{ Id = "ui-wording"; Pillar = "UI Consistency"; Severity = "medium"; Pattern = '(12週|48週|52週|残り|weeksLeft|seasonsLeft)'; Why = "Display wording often drifts from internal counters." },
  @{ Id = "phase-routing"; Pillar = "Week/Season"; Severity = "medium"; Pattern = '(weekPhase|offSeason|offWeek|ppvShow|ppvTV|showExec|weekSummary|contractNegotiation)'; Why = "Sibling flows often drift and miss a required state update." }
)

$files = Get-ScanFiles -ScanMode $Mode -Ref $BaseRef
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $repoRoot ("docs/archive/bug-audit-{0}.md" -f $timestamp)
}

$report = @()
$report += "# Bug Audit Report"
$report += ""
$report += ("- Generated: {0}" -f (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
$report += ("- Mode: {0}" -f $Mode)
$report += ("- Base ref: {0}" -f $BaseRef)
$report += ""

if ($Mode -eq "Diff") {
  $report += "## Diff Context"
  $report += ""
  $status = cmd /c "git status --short 2>nul"
  if ($status) {
    $report += "[git status]"
    foreach ($row in $status) {
      $report += $row
    }
    $report += ""
  }
}

$report += "## Scanned Files"
$report += ""
foreach ($file in $files) {
  $relative = To-RelativePath $file
  $report += ("- {0}" -f $relative)
}
$report += ""

$totalHits = 0
foreach ($rule in $rules) {
  $hits = @()
  foreach ($file in $files) {
    $matches = Select-String -Path $file -Pattern $rule.Pattern
    if ($matches) {
      $hits += $matches
    }
  }

  if ($hits.Count -eq 0) {
    continue
  }

  $totalHits += $hits.Count
  $report += ("## [{0}] {1} ({2})" -f $rule.Severity.ToUpper(), $rule.Pillar, $rule.Id)
  $report += ""
  $report += $rule.Why
  $report += ""

  foreach ($hit in $hits) {
    $relative = To-RelativePath $hit.Path
    $text = $hit.Line.Trim()
    $report += ("- {0}:{1}  {2}" -f $relative, $hit.LineNumber, $text)
  }

  $report += ""
}

$report += "## Follow-up"
$report += ""
if ($totalHits -eq 0) {
  $report += "- No configured risk patterns were detected in the scanned scope."
} else {
  $report += "- Compare each hit against sibling execution paths before fixing."
  $report += "- If a hit changes week math, verify in-season and offseason behavior together."
  $report += "- If a hit changes persistence, inspect serialize, deserialize, and migrations in one pass."
}
$report += ""

$dir = Split-Path -Parent $OutputPath
if (-not (Test-Path $dir)) {
  New-Item -ItemType Directory -Path $dir | Out-Null
}

Set-Content -Path $OutputPath -Value $report -Encoding UTF8
Write-Output ("Saved bug audit report to {0}" -f $OutputPath)

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
    $scanRoots = @('src', 'apps', 'tools', 'test', 'release') |
      ForEach-Object { Join-Path $repoRoot $_ } |
      Where-Object { Test-Path $_ }
    $scanFiles = foreach ($root in $scanRoots) {
      Get-ChildItem -Path $root -Recurse -File
    }
    $scanFiles += Get-Item (Join-Path $repoRoot 'package.json')
    return $scanFiles |
      Where-Object {
        $_.Extension -in '.js', '.html', '.css', '.json', '.ps1' -and
        $_.FullName -notmatch '[\\/](dist|staging|verify-tmp|\.git)[\\/]'
      } |
      ForEach-Object { $_.FullName }
  }

  $paths = @()
  $diffFiles = cmd /c "git diff --name-only --diff-filter=ACMRTUXB $Ref -- src test tools apps release package.json 2>nul"
  if ($LASTEXITCODE -eq 0 -and $diffFiles) {
    $paths += $diffFiles
  }

  $untracked = cmd /c "git ls-files --others --exclude-standard -- src test tools apps release package.json 2>nul"
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

function Invoke-AuditCheck {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  $started = Get-Date
  $ok = $true
  try {
    $output = & $Action 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { $ok = $false }
  } catch {
    $ok = $false
    $output = ($_ | Out-String)
  }
  $script:auditChecks += [PSCustomObject]@{
    Name = $Name
    Ok = $ok
    DurationSeconds = [math]::Round(((Get-Date) - $started).TotalSeconds, 1)
    Output = $output.Trim()
  }
}

$rules = @(
  @{ Id = "week-math"; Pillar = "Week/Season"; Severity = "high"; Pattern = '(\* 52\b|\* 12\b|season \* 12\b|13 - \(G\.week|week > 48|week === 48|week >= 48)'; Why = "Mixed time units are a recurring failure source." },
  @{ Id = "state-migration"; Pillar = "Save/Load"; Severity = "high"; Pattern = '(serialize|deserialize|_migrated_|backward compat|migration)'; Why = "State migrations often preserve outdated assumptions." },
  @{ Id = "roster-movement"; Pillar = "Join/Leave/Transfer"; Severity = "high"; Pattern = '(transfer|retire|retired|freeAgents|rentals|rental|orgJoinWeek|coachAssign|pendingRosterOverflowSigning)'; Why = "Roster movement bugs often leave stale references behind." },
  @{ Id = "season-stats"; Pillar = "Season Transition"; Severity = "medium"; Pattern = '(seasonStats|seasonHistory|fundsHistory|orgPopHistory|peakPop|peakFunds)'; Why = "Season summaries break when one route updates only part of the state." },
  @{ Id = "ui-wording"; Pillar = "UI Consistency"; Severity = "medium"; Pattern = '(12週|48週|52週|残り|weeksLeft|seasonsLeft)'; Why = "Display wording often drifts from internal counters." },
  @{ Id = "phase-routing"; Pillar = "Week/Season"; Severity = "medium"; Pattern = '(weekPhase|offSeason|offWeek|ppvShow|ppvTV|showExec|weekSummary|contractNegotiation)'; Why = "Sibling flows often drift and miss a required state update." }
  @{ Id = "demo-boundary"; Pillar = "Public Demo"; Severity = "high"; Pattern = '(battle-demo|DEMO_|WMDemo|WM_DEMO|shared/match-engine)'; Why = "The public demo must keep product saves, private data, and unpublished assets out of its build." }
  @{ Id = "result-attribution"; Pillar = "Match Result"; Severity = "high"; Pattern = '(winnerId|loserId|finisher|finishMove|result\.winner|teamA|teamB)'; Why = "Winner/loser ordering and tag finisher attribution have distinct display and state paths." }
)

$files = Get-ScanFiles -ScanMode $Mode -Ref $BaseRef
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$auditChecks = @()

$jsFiles = @($files | Where-Object { $_.EndsWith('.js') })
if ($jsFiles.Count -gt 0) {
  Invoke-AuditCheck "JavaScript syntax ($($jsFiles.Count) changed/scanned files)" {
    $failed = @()
    foreach ($file in $jsFiles) {
      & node --check $file 2>&1 | Out-Host
      if ($LASTEXITCODE -ne 0) { $failed += (To-RelativePath $file) }
    }
    if ($failed.Count -gt 0) { throw "Syntax failures: $($failed -join ', ')" }
  }
}

Invoke-AuditCheck "Stale-test detector (strict)" {
  & node test/stale-lint.js --strict
}

if ($Mode -eq "Full") {
  Invoke-AuditCheck "Full regression suite" {
    & node test/run-all.js
  }
  Invoke-AuditCheck "Engine integrity simulation (20 seasons)" {
    & node test/auto-sim.js 20
  }
  Invoke-AuditCheck "Public battle-demo build and contract" {
    & node test/battle-demo-test.js
  }
} else {
  Invoke-AuditCheck "Quick regression suite" {
    & node test/run-all.js --quick
  }
  $touchesDemo = @($files | Where-Object {
    $_ -match '[\\/](apps[\\/]battle-demo|tools[\\/]battle-demo|test[\\/]battle-demo-test)'
  }).Count -gt 0
  if ($touchesDemo) {
    Invoke-AuditCheck "Public battle-demo build and contract" {
      & node test/battle-demo-test.js
    }
  }
}

Invoke-AuditCheck "Git diff whitespace" {
  # Git writes harmless CRLF conversion warnings to stderr in this Windows worktree.
  # Keep stderr out of PowerShell's native-command error stream; exit status remains the gate.
  & cmd /c "git diff --check 2>nul"
}

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

$report += "## Executed Checks"
$report += ""
foreach ($check in $auditChecks) {
  $status = if ($check.Ok) { "PASS" } else { "FAIL" }
  $report += ("- [{0}] {1} ({2}s)" -f $status, $check.Name, $check.DurationSeconds)
  if (-not $check.Ok -and $check.Output) {
    $tail = $check.Output -split "`r?`n" | Select-Object -Last 12
    foreach ($line in $tail) { $report += ("  {0}" -f $line) }
  }
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
if ($auditChecks.Where({ -not $_.Ok }).Count -gt 0) {
  $report += "- One or more executable checks failed. Treat this audit as failed before triaging heuristic scan hits."
} elseif ($totalHits -eq 0) {
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

if ($auditChecks.Where({ -not $_.Ok }).Count -gt 0) {
  exit 1
}

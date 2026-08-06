# Verifies that a file-changing task is safe to report as complete.
# Run only after committing the task's scoped changes.

[CmdletBinding()]
param(
    [ValidateSet('Complete', 'PendingReview', 'Blocked')]
    [string]$Status = 'Complete'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ProjectDir = Split-Path -Parent $PSScriptRoot
$GitCommand = Get-Command git -ErrorAction SilentlyContinue
if (-not $GitCommand) {
    Write-Error 'Git was not found. Task completion cannot be verified.'
    exit 1
}

$Changes = @(& $GitCommand.Source -C $ProjectDir status --short)
if ($LASTEXITCODE -ne 0) {
    Write-Error 'git status failed. Task completion cannot be verified.'
    exit 1
}

if ($Changes.Count -gt 0) {
    Write-Host "STATUS: $Status" -ForegroundColor Yellow
    Write-Host 'Uncommitted changes remain. Do not report COMPLETE; commit them or preserve them in a WIP worktree commit.' -ForegroundColor Red
    $Changes | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 1
}

$Head = (& $GitCommand.Source -C $ProjectDir log -1 --pretty=format:'%h %s').Trim()
if ($LASTEXITCODE -ne 0 -or -not $Head) {
    Write-Error 'The latest commit could not be read. Task completion cannot be verified.'
    exit 1
}

Write-Host "STATUS: $Status" -ForegroundColor Green
Write-Host 'Working tree is clean.' -ForegroundColor Green
Write-Host "HEAD: $Head" -ForegroundColor Cyan

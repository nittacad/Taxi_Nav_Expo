# GitHub publish fare-waveform-akihabara.json (iPhone remote sync)
# Usage: npm run publish:fare-waveform-akihabara-json

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path $PSScriptRoot -Parent
$JsonPath = Join-Path $ProjectDir "data/fare-waveform-akihabara.json"
$GeneratedPath = Join-Path $ProjectDir "src/data/fareWaveformAkihabara.generated.ts"

if (-not (Test-Path $JsonPath)) {
    Write-Error "JSON not found. Run export first: npm run export:akihabara-fare-waveform"
}

Set-Location $ProjectDir

if (-not (Test-Path ".git")) {
    Write-Warning "Not a git repository. Upload JSON to GitHub manually."
    Write-Host "File: $JsonPath"
    exit 0
}

git add $JsonPath $GeneratedPath

$status = git status --porcelain -- "data/fare-waveform-akihabara.json" "src/data/fareWaveformAkihabara.generated.ts"
if (-not $status) {
    Write-Host "No changes - skip push"
    exit 0
}

git commit -m "chore: update Akihabara fare waveform JSON for iPhone sync"
git push

Write-Host ""
Write-Host "Published. Check app.json fareWaveformAkihabaraJsonUrl."

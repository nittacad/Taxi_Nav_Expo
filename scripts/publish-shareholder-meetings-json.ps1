# GitHub 等に shareholder-meetings.json を公開（iPhone 自動更新用）
# 用法: npm run publish:shareholder-meetings-json

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path $PSScriptRoot -Parent
$JsonPath = Join-Path $ProjectDir "data/shareholder-meetings.json"
$MetaPath = Join-Path $ProjectDir "data/shareholder-meetings-fetch-meta.json"

if (-not (Test-Path $JsonPath)) {
    Write-Error "JSON not found. Run fetch first: npm run run:shareholder-meetings-auto-fetch"
}

Set-Location $ProjectDir

if (-not (Test-Path ".git")) {
    Write-Warning "Git リポジトリではありません。JSON を手動で GitHub / Gist にアップロードしてください。"
    Write-Host "ファイル: $JsonPath"
    exit 0
}

git add $JsonPath
if (Test-Path $MetaPath) { git add $MetaPath }

$status = git status --porcelain -- "data/shareholder-meetings.json" "data/shareholder-meetings-fetch-meta.json"
if (-not $status) {
    Write-Host "変更なし — push スキップ"
    exit 0
}

git commit -m "chore: update shareholder meetings JSON for iPhone sync"
git push

Write-Host ""
Write-Host "公開完了。app.json の shareholderMeetingsJsonUrl に raw URL を設定してください。"
Write-Host "例: https://raw.githubusercontent.com/USER/REPO/main/Taxi_Nav_Expo/data/shareholder-meetings.json"

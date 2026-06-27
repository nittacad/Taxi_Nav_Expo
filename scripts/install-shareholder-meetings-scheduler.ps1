# 株主総会 fetch を「毎月1日 9:00」に自動実行するタスクを登録
# 用法: powershell -ExecutionPolicy Bypass -File scripts/install-shareholder-meetings-scheduler.ps1

$ErrorActionPreference = "Stop"

$TaskName = "TaxiNav_ShareholderMeetings_Monthly"
$ProjectDir = Split-Path $PSScriptRoot -Parent
$RunnerScript = Join-Path $PSScriptRoot "scheduled-fetch-shareholder-meetings.ps1"

if (-not (Test-Path $RunnerScript)) {
    Write-Error "Runner script not found: $RunnerScript"
}

$EnvFile = Join-Path $ProjectDir ".env.local"
if (-not (Test-Path $EnvFile)) {
    Write-Warning ".env.local がありません。先に EDINETDB_API_KEY を設定してください。"
}

$Trigger = New-ScheduledTaskTrigger -Monthly -DaysOfMonth 1 -At "09:00"
$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$RunnerScript`"" `
    -WorkingDirectory $ProjectDir

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Trigger $Trigger `
    -Action $Action `
    -Settings $Settings `
    -Description "Taxi_Nav: EDINET DB から株主総会スケジュールを月1回自動取得" `
    -Force | Out-Null

Write-Host ""
Write-Host "登録完了: $TaskName"
Write-Host "  実行: 毎月1日 9:00"
Write-Host "  スクリプト: $RunnerScript"
Write-Host "  ログ: $ProjectDir\data\shareholder-meetings-fetch.log"
Write-Host ""
Write-Host "今すぐ1回試す場合:"
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$RunnerScript`""
Write-Host ""
Write-Host "解除する場合:"
Write-Host "  npm run uninstall:shareholder-meetings-auto-fetch"

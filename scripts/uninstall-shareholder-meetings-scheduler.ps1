# 月次自動 fetch タスクを解除
# 用法: powershell -ExecutionPolicy Bypass -File scripts/uninstall-shareholder-meetings-scheduler.ps1

$TaskName = "TaxiNav_ShareholderMeetings_Monthly"

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "解除しました: $TaskName"
}
else {
    Write-Host "タスクは登録されていません: $TaskName"
}

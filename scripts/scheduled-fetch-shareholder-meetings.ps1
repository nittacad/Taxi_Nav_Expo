# 株主総会データの月次自動取得（Windows タスクスケジューラから呼ばれる）
# 手動実行: powershell -ExecutionPolicy Bypass -File scripts/scheduled-fetch-shareholder-meetings.ps1

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path $PSScriptRoot -Parent
$LogDir = Join-Path $ProjectDir "data"
$LogFile = Join-Path $LogDir "shareholder-meetings-fetch.log"
$StatusFile = Join-Path $LogDir "shareholder-meetings-last-fetch.txt"
$EnvFile = Join-Path $ProjectDir ".env.local"

Set-Location $ProjectDir

function Write-Log([string]$Message) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    Write-Host $line
}

Write-Log "=== 月次 fetch 開始 ==="

if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            $name = $Matches[1].Trim()
            $value = $Matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

if (-not $env:EDINETDB_API_KEY -and -not $env:EDINET_API_KEY) {
    Write-Log "ERROR: EDINETDB_API_KEY が未設定です (.env.local を確認)"
    exit 1
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Log "ERROR: python が見つかりません"
    exit 1
}

try {
    & python (Join-Path $ProjectDir "scripts/fetch-shareholder-meetings-edinetdb.py") --replace 2>&1 | ForEach-Object {
        Write-Log $_
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Log "ERROR: fetch 失敗 (exit $LASTEXITCODE)"
        exit $LASTEXITCODE
    }
    $status = @(
        "last_success: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "mode: monthly-scheduled",
        "command: fetch-shareholder-meetings-edinetdb.py --replace"
    ) -join "`n"
    Set-Content -Path $StatusFile -Value $status -Encoding UTF8
    Write-Log "=== 月次 fetch 完了 ==="

    $publishScript = Join-Path $PSScriptRoot "publish-shareholder-meetings-json.ps1"
    if (Test-Path $publishScript) {
        Write-Log "JSON 公開を試行..."
        & powershell -NoProfile -ExecutionPolicy Bypass -File $publishScript 2>&1 | ForEach-Object { Write-Log $_ }
    }

    exit 0
}
catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    exit 1
}

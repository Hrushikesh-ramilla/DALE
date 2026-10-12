$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$taskDirectory = Join-Path $taskRoot '.data/local-preview'
$taskStatePath = Join-Path $taskDirectory 'state.json'
if (Test-Path -LiteralPath $taskStatePath) {
    $taskState = Get-Content -LiteralPath $taskStatePath -Raw | ConvertFrom-Json
    if (Get-Process -Id $taskState.pid -ErrorAction SilentlyContinue) {
        node scripts/local-preview.mjs status
        exit 0
    }
}
if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
    throw 'Port 3000 is occupied. The existing process has been left untouched.'
}
if (!(Test-Path -LiteralPath '.next/preview-build.json')) {
    throw 'Build first: npm run build, then node scripts/prepare-production-browser.mjs.'
}
New-Item -ItemType Directory -Path $taskDirectory -Force | Out-Null
$taskNode = (Get-Command node -ErrorAction Stop).Source
$taskProcess = Start-Process -FilePath $taskNode -ArgumentList @('scripts/local-preview.mjs', 'supervise') -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskDirectory 'stdout.log') -RedirectStandardError (Join-Path $taskDirectory 'stderr.log') -PassThru
$taskDeadline = (Get-Date).AddSeconds(45)
do {
    Start-Sleep -Milliseconds 500
    $taskProcess.Refresh()
    if ($taskProcess.HasExited) {
        throw 'Preview stopped during startup. Inspect .data/local-preview/stderr.log.'
    }
    try {
        $taskHealth = Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -TimeoutSec 3
        if ($taskHealth.status -eq 'ready') {
            Write-Output 'Preview ready: http://localhost:3000/demo (persistent data, automatic process recovery).'
            exit 0
        }
    } catch {}
} while ((Get-Date) -lt $taskDeadline)
throw 'Preview has not become ready. Inspect local logs and npm run preview:status.'

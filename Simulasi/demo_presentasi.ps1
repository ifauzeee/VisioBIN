param(
    [string]$User = $env:VISIOBIN_USER,
    [string]$Password = $env:VISIOBIN_PASS,
    [string]$ApiUrl = $env:VISIOBIN_API,
    [string]$ApiKey = $env:API_KEY,
    [int]$MonitorInterval = 5
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")
$PythonScript = Join-Path $ScriptDir "simulasi_visiobin.py"

function Resolve-Value {
    param(
        [string]$Value,
        [string]$Prompt,
        [string]$Default
    )

    if (-not [string]::IsNullOrWhiteSpace($Value)) {
        return $Value
    }

    $typed = Read-Host "$Prompt [$Default]"
    if ([string]::IsNullOrWhiteSpace($typed)) {
        return $Default
    }
    return $typed
}

function Invoke-VisioBin {
    param([string[]]$ExtraArgs)

    $baseArgs = @(
        $PythonScript,
        "--user", $script:User,
        "--pass", $script:Password,
        "--url", $script:ApiUrl,
        "--api-key", $script:ApiKey
    )

    & py @baseArgs @ExtraArgs
}

function Show-BackendLog {
    Push-Location $ProjectRoot
    try {
        Write-Host ""
        Write-Host "Log backend filtered: offline / worker"
        Write-Host "Tekan Ctrl+C untuk berhenti."
        docker compose logs -f backend 2>&1 | Select-String -Pattern "offline|worker"
    }
    finally {
        Pop-Location
    }
}

function Show-Menu {
    Clear-Host
    Write-Host "VISIOBIN - Demo Presentasi Windows"
    Write-Host "API  : $script:ApiUrl"
    Write-Host "User : $script:User"
    Write-Host ""
    Write-Host "1) Kirim telemetri NORMAL"
    Write-Host "2) Simulasi SENSOR OFFLINE / BIN DOWN"
    Write-Host "3) Simulasi DELAY TINGGI"
    Write-Host "4) Simulasi PACKET LOSS"
    Write-Host "5) Simulasi GATEWAY DOWN"
    Write-Host "6) Simulasi BIN HAMPIR PENUH"
    Write-Host "7) Cek STATUS & ALERT sekarang"
    Write-Host "8) Jalankan SEMUA skenario"
    Write-Host "9) Live monitor dashboard"
    Write-Host "l) Lihat log backend offline/worker"
    Write-Host "o) Buka dashboard web"
    Write-Host "q) Keluar"
    Write-Host ""
}

if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
    Write-Error "Python launcher 'py' tidak ditemukan. Install Python for Windows, lalu coba lagi."
}

$User = Resolve-Value -Value $User -Prompt "Username admin" -Default "admin"
$Password = Resolve-Value -Value $Password -Prompt "Password admin" -Default "admin123"
$ApiUrl = Resolve-Value -Value $ApiUrl -Prompt "API URL" -Default "http://localhost:8080/api/v1"
$ApiKey = Resolve-Value -Value $ApiKey -Prompt "API key IoT" -Default "visiobin-iot-secret-key"

$env:VISIOBIN_USER = $User
$env:VISIOBIN_PASS = $Password
$env:VISIOBIN_API = $ApiUrl
$env:API_KEY = $ApiKey

Invoke-VisioBin -ExtraArgs @("--setup")

while ($true) {
    Show-Menu
    $choice = Read-Host "Pilihan"

    switch ($choice.ToLowerInvariant()) {
        "1" { Invoke-VisioBin -ExtraArgs @("--normal") }
        "2" { Invoke-VisioBin -ExtraArgs @("--skenario", "1") }
        "3" { Invoke-VisioBin -ExtraArgs @("--skenario", "2") }
        "4" { Invoke-VisioBin -ExtraArgs @("--skenario", "3") }
        "5" { Invoke-VisioBin -ExtraArgs @("--skenario", "4") }
        "6" { Invoke-VisioBin -ExtraArgs @("--skenario", "5") }
        "7" { Invoke-VisioBin -ExtraArgs @("--status") }
        "8" { Invoke-VisioBin -ExtraArgs @("--semua") }
        "9" { Invoke-VisioBin -ExtraArgs @("--monitor", "--interval", "$MonitorInterval") }
        "l" { Show-BackendLog }
        "o" { Start-Process "http://localhost:3000" }
        "q" { break }
        default { Write-Host "Pilihan tidak dikenal." }
    }

    if ($choice.ToLowerInvariant() -ne "q") {
        Write-Host ""
        Read-Host "Tekan Enter untuk kembali ke menu"
    }
}

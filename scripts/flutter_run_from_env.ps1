param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$FlutterArgs
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile = Join-Path $root ".env"
$mobileDir = Join-Path $root "mobile_app"

if (-not (Test-Path $envFile)) {
  throw "File .env tidak ditemukan di $envFile"
}

$requiredKeys = @("API_BASE_URL", "WS_BASE_URL", "CAMERA_STREAM_URL")
$values = @{}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
    return
  }

  $parts = $line.Split("=", 2)
  $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
}

$dartDefines = @()
foreach ($key in $requiredKeys) {
  if (-not $values.ContainsKey($key) -or -not $values[$key]) {
    throw "Variabel $key wajib ada di root .env"
  }
  $dartDefines += "--dart-define=$key=$($values[$key])"
}

Push-Location $mobileDir
try {
  flutter run @dartDefines @FlutterArgs
}
finally {
  Pop-Location
}


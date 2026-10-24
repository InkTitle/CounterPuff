# Run from the project root in Windows PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\pack-plesk.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root
$zip = Join-Path $root "CounterPuff-plesk-upload.zip"
$stage = Join-Path $env:TEMP "counterpuff-plesk-stage"

if (Test-Path $zip) { Remove-Item $zip -Force }
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

robocopy $root $stage /E /NFL /NDL /NJH /NJS /nc /ns /np `
  /XD node_modules .next .git logs `
  /XF .env CounterPuff-plesk-upload.zip | Out-Null

Copy-Item (Join-Path $root "deploy\plesk\PLESK-WINDOWS.md") (Join-Path $stage "READ-ME-FIRST-PLESK.txt") -Force

Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -CompressionLevel Optimal
Remove-Item $stage -Recurse -Force
Write-Host "Created $zip"
Write-Host "In Plesk File Manager: upload, extract into the Node.js application root, then follow READ-ME-FIRST-PLESK.txt"

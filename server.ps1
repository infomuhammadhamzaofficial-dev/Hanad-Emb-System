param(
    [int]$Port = 8080
)

$rootDir = $PSScriptRoot

# Detect Local LAN IPv4 for Mobile Testing
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress
if (-not $ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -First 1).IPAddress
}
if (-not $ip) {
    $ip = "localhost"
}

# Compile high-speed multi-threaded C# server engine
$enginePath = Join-Path $rootDir "ServerEngine.cs"
Add-Type -Path $enginePath

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CRAFTFLOW HAND EMBROIDERY HIGH-SPEED SERVER STARTED    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PC Link:     http://localhost:$Port" -ForegroundColor Yellow
Write-Host "  Mobile Link: http://$($ip):$Port" -ForegroundColor Magenta
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Mobile aur PC dono ko SAME Wi-Fi par connect hona chahiye" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

$server = New-Object FastServer
try {
    $server.Start($Port, $rootDir)
} finally {
    $server.Stop()
}

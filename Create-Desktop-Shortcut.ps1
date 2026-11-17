# ============================================================
# CraftFlow: Create Desktop App Shortcut with Official Icon
# ============================================================

$projectDir = $PSScriptRoot
$desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
if (-not $desktopPath -or -not (Test-Path $desktopPath)) {
    $desktopPath = Join-Path $env:USERPROFILE "Desktop"
}

$shortcutPath = Join-Path $desktopPath "CraftFlow Hand Embroidery.lnk"
$iconPath = Join-Path $projectDir "icon.ico"
$vbsPath = Join-Path $projectDir "CraftFlow.vbs"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$vbsPath`""
$Shortcut.WorkingDirectory = $projectDir
$Shortcut.WindowStyle = 7
$Shortcut.Description = "CraftFlow - Hand Embroidery Production & Inventory SaaS"
if (Test-Path $iconPath) {
    $Shortcut.IconLocation = "$iconPath,0"
}
$Shortcut.Save()

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " CraftFlow Desktop Shortcut Created Successfully!" -ForegroundColor Green
Write-Host " Shortcut: $shortcutPath" -ForegroundColor Yellow
Write-Host " Double-click this icon anytime to launch CraftFlow!" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

$desktop = [System.Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop 'TeleBridge.lnk'

# Remove old shortcut if exists
if (Test-Path $lnkPath) {
    Remove-Item $lnkPath -Force
    Write-Host 'Old shortcut removed.'
}

# Determine target: use wscript.exe to run the VBScript hidden
$vbsPath = 'C:\Users\Bizcochito\Downloads\TeleBridge\TeleBridge.vbs'
$target = "wscript.exe"
$arguments = "`"$vbsPath`""
$iconPath = 'C:\Users\Bizcochito\Downloads\TeleBridge\build\icon.ico'
$workDir = 'C:\Users\Bizcochito\Downloads\TeleBridge'

# Create WScript.Shell COM object
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($lnkPath)
$shortcut.TargetPath = $target
$shortcut.Arguments = $arguments
$shortcut.IconLocation = "$iconPath,0"
$shortcut.WorkingDirectory = $workDir
$shortcut.Description = 'TeleBridge - Telegram Bot Manager'
$shortcut.WindowStyle = 1   # Normal window (WScript handles the hiding of the app itself)
$shortcut.Save()

Write-Host "Shortcut created: $lnkPath"
Write-Host "Icon: $iconPath"

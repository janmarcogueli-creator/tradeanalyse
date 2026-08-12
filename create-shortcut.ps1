# Legt Desktop-Shortcut fuer tradeanalyse an. Einmalig ausfuehren.

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $root "start.bat"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "tradeanalyse.lnk"

$wsh = New-Object -ComObject WScript.Shell
$s = $wsh.CreateShortcut($shortcutPath)
$s.TargetPath = $target
$s.WorkingDirectory = $root
$s.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,137"
$s.Description = "tradeanalyse starten"
$s.Save()

Write-Host "Desktop-Shortcut erstellt: $shortcutPath"

# Refresh PATH in current session by combining User and Machine paths
$env:Path = [Environment]::GetEnvironmentVariable('PATH', 'User') + ';' + [Environment]::GetEnvironmentVariable('PATH', 'Machine')

Write-Output "PATH refreshed in current session"
Write-Output ""
Write-Output "Verifying npm directory is in PATH:"
$npmPath = 'C:\Users\17175\AppData\Roaming\npm'
if ($env:Path -like "*$npmPath*") {
    Write-Output "SUCCESS: $npmPath is in current session PATH"
} else {
    Write-Output "WARNING: $npmPath not found in current session PATH"
}

Write-Output ""
Write-Output "Testing claude command availability:"
$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCmd) {
    Write-Output "SUCCESS: claude command found at: $($claudeCmd.Source)"
} else {
    Write-Output "WARNING: claude command not found"
}
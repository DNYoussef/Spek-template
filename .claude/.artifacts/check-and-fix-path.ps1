$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
$npmPath = 'C:\Users\17175\AppData\Roaming\npm'

Write-Output "Looking for exact path: $npmPath"
Write-Output ""

# Check for exact match
$pathEntries = $currentPath -split ';'
$exactMatch = $pathEntries | Where-Object { $_ -eq $npmPath }

if ($exactMatch) {
    Write-Output "FOUND: $npmPath is already in PATH"
} else {
    Write-Output "NOT FOUND: $npmPath is missing from PATH"
    Write-Output "Adding it now..."

    $newPath = "$currentPath;$npmPath"
    [Environment]::SetEnvironmentVariable('PATH', $newPath, 'User')
    Write-Output "SUCCESS: Added $npmPath to User PATH"
}

Write-Output ""
Write-Output "Current PATH entries containing 'npm' or 'Roaming':"
[Environment]::GetEnvironmentVariable('PATH', 'User') -split ';' | Where-Object { $_ -like '*npm*' -or $_ -like '*Roaming*' }
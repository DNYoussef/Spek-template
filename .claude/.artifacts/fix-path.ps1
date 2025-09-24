$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
$npmPath = 'C:\Users\17175\AppData\Roaming\npm'

if ($currentPath -notlike "*$npmPath*") {
    $newPath = "$currentPath;$npmPath"
    [Environment]::SetEnvironmentVariable('PATH', $newPath, 'User')
    Write-Output "Successfully added $npmPath to User PATH"
} else {
    Write-Output "npm directory already in PATH"
}

# Show updated PATH
Write-Output "`nUpdated PATH entries containing 'npm':"
[Environment]::GetEnvironmentVariable('PATH', 'User') -split ';' | Where-Object { $_ -like '*npm*' }
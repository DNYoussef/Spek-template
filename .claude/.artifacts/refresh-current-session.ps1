# Force reload PATH in current PowerShell session
$env:Path = [Environment]::GetEnvironmentVariable('PATH', 'User') + ';' + [Environment]::GetEnvironmentVariable('PATH', 'Machine')

Write-Output "PATH has been refreshed in current session"
Write-Output ""

# Verify npm directory is present
$npmPath = 'C:\Users\17175\AppData\Roaming\npm'
if ($env:Path -split ';' | Where-Object { $_ -eq $npmPath }) {
    Write-Output "✓ npm directory is in PATH: $npmPath"
} else {
    Write-Output "✗ npm directory NOT found in PATH"
}

Write-Output ""

# Test claude command
try {
    $claudeVersion = & claude --version 2>&1
    Write-Output "✓ claude command works: $claudeVersion"
    Write-Output ""
    Write-Output "You can now use: claude --dangerously-skip-permissions"
} catch {
    Write-Output "✗ claude command still not found"
    Write-Output ""
    Write-Output "Use this instead:"
    Write-Output "  npx @anthropic-ai/claude-code --dangerously-skip-permissions"
}
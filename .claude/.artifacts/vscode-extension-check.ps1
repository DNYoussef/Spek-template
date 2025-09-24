# Check VS Code Claude extension installation
$vscodeExtensionsPath = "$env:USERPROFILE\.vscode\extensions"

Write-Output "Searching for Claude Code extension in VS Code..."
Write-Output "Extensions path: $vscodeExtensionsPath"
Write-Output ""

if (Test-Path $vscodeExtensionsPath) {
    $claudeExtensions = Get-ChildItem $vscodeExtensionsPath -Directory | Where-Object {
        $_.Name -like '*claude*' -or $_.Name -like '*anthropic*'
    }

    if ($claudeExtensions) {
        Write-Output "Found Claude extensions:"
        $claudeExtensions | ForEach-Object {
            Write-Output "  - $($_.Name)"

            # Check for package.json to get version
            $packageJson = Join-Path $_.FullName "package.json"
            if (Test-Path $packageJson) {
                $package = Get-Content $packageJson | ConvertFrom-Json
                Write-Output "    Version: $($package.version)"
                Write-Output "    Display Name: $($package.displayName)"
            }
        }
    } else {
        Write-Output "No Claude Code extensions found in VS Code"
        Write-Output ""
        Write-Output "Install it from:"
        Write-Output "  https://marketplace.visualstudio.com/items?itemName=Anthropic.claude-code"
        Write-Output ""
        Write-Output "Or in VS Code:"
        Write-Output "  1. Press Ctrl+Shift+X"
        Write-Output "  2. Search for 'Claude Code'"
        Write-Output "  3. Click Install"
    }
} else {
    Write-Output "VS Code extensions directory not found at: $vscodeExtensionsPath"
}

Write-Output ""
Write-Output "Checking VS Code installation..."
$vscodeExe = "C:\Users\17175\AppData\Local\Programs\Microsoft VS Code\Code.exe"
if (Test-Path $vscodeExe) {
    Write-Output "VS Code found at: $vscodeExe"
} else {
    Write-Output "VS Code not found at expected location"
}
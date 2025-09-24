# Update PATH for VSCode Connascence Wrapper v2.0.0
# This script adds the wrapper directory to your PATH environment variable

Write-Host "=== VSCode Connascence Wrapper - PATH Update ===" -ForegroundColor Cyan
Write-Host ""

# Wrapper directory to add
$wrapperDir = "C:\Users\17175\AppData\Local\Programs"

# Get current user PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

# Check if already in PATH
if ($currentPath -like "*$wrapperDir*") {
    Write-Host "[OK] Wrapper directory already in PATH!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current PATH includes: $wrapperDir" -ForegroundColor Gray
} else {
    Write-Host "[ACTION] Adding wrapper directory to PATH..." -ForegroundColor Yellow

    # Add to beginning of PATH (so it takes precedence)
    $newPath = "$wrapperDir;$currentPath"

    # Update PATH
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")

    Write-Host "[SUCCESS] PATH updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Added: $wrapperDir" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Verification ===" -ForegroundColor Cyan

# Verify wrapper files exist
Write-Host ""
Write-Host "Checking wrapper files..." -ForegroundColor Yellow
$wrapperFile = "$wrapperDir\connascence-wrapper.bat"
$aliasFile = "$wrapperDir\connascence.bat"

if (Test-Path $wrapperFile) {
    $fileSize = (Get-Item $wrapperFile).Length
    Write-Host "[OK] connascence-wrapper.bat found ($fileSize bytes)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] connascence-wrapper.bat NOT FOUND!" -ForegroundColor Red
}

if (Test-Path $aliasFile) {
    Write-Host "[OK] connascence.bat found" -ForegroundColor Green
} else {
    Write-Host "[WARN] connascence.bat not found (optional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. CLOSE this PowerShell window" -ForegroundColor White
Write-Host "2. CLOSE ALL VSCode windows" -ForegroundColor White
Write-Host "3. REOPEN VSCode" -ForegroundColor White
Write-Host "4. Open integrated terminal in VSCode" -ForegroundColor White
Write-Host "5. Run: where connascence" -ForegroundColor White
Write-Host ""
Write-Host "Expected output (wrapper should be FIRST):" -ForegroundColor Gray
Write-Host "  C:\Users\17175\AppData\Local\Programs\connascence.bat" -ForegroundColor Gray
Write-Host "  C:\Users\17175\AppData\Roaming\Python\Python312\Scripts\connascence.exe" -ForegroundColor Gray
Write-Host ""
Write-Host "=== Test Extension ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "After restarting VSCode:" -ForegroundColor White
Write-Host "1. Open any Python file (e.g., setup.py)" -ForegroundColor White
Write-Host "2. Press Ctrl+Alt+A" -ForegroundColor White
Write-Host "3. Check Problems panel for violations" -ForegroundColor White
Write-Host ""
Write-Host "[READY] PATH update complete! Follow the steps above." -ForegroundColor Green
Write-Host ""
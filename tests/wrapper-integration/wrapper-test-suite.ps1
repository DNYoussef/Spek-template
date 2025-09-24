# VSCode Extension Wrapper Test Suite
# Tests the connascence-wrapper.bat argument translation and edge cases

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Configuration
$WRAPPER = "C:\Users\17175\AppData\Local\Programs\connascence-wrapper.bat"
$TEST_DIR = "C:\Users\17175\Desktop\spek template\tests\wrapper-integration\test-files"
$RESULTS = @()

# Color output functions
function Write-TestHeader($msg) {
    Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

function Write-Pass($msg) {
    Write-Host "  [PASS] $msg" -ForegroundColor Green
}

function Write-Fail($msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

function Write-Warn($msg) {
    Write-Host "  [WARN] $msg" -ForegroundColor Yellow
}

# Test execution helper
function Test-WrapperCommand {
    param(
        [string]$TestName,
        [string]$Command,
        [string]$ExpectedPattern = "",
        [bool]$ShouldFail = $false
    )

    $startTime = Get-Date

    try {
        # Execute command and capture output
        $output = Invoke-Expression "cmd /c `"$Command`" 2>&1" | Out-String
        $exitCode = $LASTEXITCODE

        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds

        # Determine pass/fail
        $passed = $false
        $reason = ""

        if ($ShouldFail) {
            if ($exitCode -ne 0) {
                $passed = $true
                $reason = "Failed as expected (exit: $exitCode)"
            } else {
                $reason = "Should have failed but succeeded"
            }
        } else {
            if ($exitCode -eq 0) {
                if ($ExpectedPattern -eq "" -or $output -match $ExpectedPattern) {
                    $passed = $true
                    $reason = "Success (exit: $exitCode, ${duration}ms)"
                } else {
                    $reason = "Pattern not found in output"
                }
            } else {
                $reason = "Command failed (exit: $exitCode)"
            }
        }

        # Record result
        $global:RESULTS += [PSCustomObject]@{
            Test = $TestName
            Category = ""
            Passed = $passed
            Duration = $duration
            ExitCode = $exitCode
            Reason = $reason
            Output = $output.Substring(0, [Math]::Min(200, $output.Length))
        }

        if ($passed) {
            Write-Pass "$TestName - $reason"
        } else {
            Write-Fail "$TestName - $reason"
            Write-Host "    Output: $($output.Substring(0, [Math]::Min(100, $output.Length)))" -ForegroundColor Gray
        }

        return $passed

    } catch {
        $global:RESULTS += [PSCustomObject]@{
            Test = $TestName
            Category = ""
            Passed = $false
            Duration = 0
            ExitCode = -1
            Reason = "Exception: $($_.Exception.Message)"
            Output = ""
        }
        Write-Fail "$TestName - Exception: $($_.Exception.Message)"
        return $false
    }
}

# ============================================================================
# TEST CATEGORY 1: Argument Translation
# ============================================================================
Write-TestHeader "Category 1: Argument Translation Tests"

# Test 1.1: Extension format to CLI format (basic)
Test-WrapperCommand `
    -TestName "1.1: Extension format basic translation" `
    -Command "$WRAPPER analyze `"$TEST_DIR\simple.py`" --profile standard --format json" `
    -ExpectedPattern "analysis_complete|completed"

# Test 1.2: Extension format with modern_general policy
Test-WrapperCommand `
    -TestName "1.2: Extension format with modern_general policy" `
    -Command "$WRAPPER analyze `"$TEST_DIR\simple.py`" --profile modern_general --format json" `
    -ExpectedPattern "analysis_complete|completed"

# Test 1.3: Extension format with strict policy and SARIF
Test-WrapperCommand `
    -TestName "1.3: Extension format with strict + SARIF" `
    -Command "$WRAPPER analyze `"$TEST_DIR\simple.py`" --profile strict --format sarif" `
    -ExpectedPattern "analysis_complete|completed"

# Test 1.4: Direct format passthrough (correct args)
Test-WrapperCommand `
    -TestName "1.4: Direct format passthrough" `
    -Command "$WRAPPER `"$TEST_DIR\simple.py`" --policy standard --format json" `
    -ExpectedPattern "analysis_complete|completed"

# Test 1.5: Help command passthrough
Test-WrapperCommand `
    -TestName "1.5: Help command passthrough" `
    -Command "$WRAPPER --help" `
    -ExpectedPattern "Connascence Safety Analyzer"

# Test 1.6: List policies command
Test-WrapperCommand `
    -TestName "1.6: List policies command" `
    -Command "$WRAPPER --list-policies" `
    -ExpectedPattern "Available policy names"

# ============================================================================
# TEST CATEGORY 2: Edge Cases - Special Characters
# ============================================================================
Write-TestHeader "Category 2: Edge Cases - Special Characters in Filenames"

# Test 2.1: Spaces in filename
Test-WrapperCommand `
    -TestName "2.1: Filename with spaces" `
    -Command "$WRAPPER analyze `"$TEST_DIR\my file.py`" --profile standard --format json" `
    -ExpectedPattern "analysis_complete|completed"

# Test 2.2: Parentheses in filename
Test-WrapperCommand `
    -TestName "2.2: Filename with parentheses" `
    -Command "$WRAPPER analyze `"$TEST_DIR\file(1).py`" --profile standard --format json" `
    -ExpectedPattern "analysis_complete|completed"

# Test 2.3: Absolute Windows path
Test-WrapperCommand `
    -TestName "2.3: Absolute Windows path" `
    -Command "$WRAPPER analyze `"$TEST_DIR\simple.py`" --profile standard --format json" `
    -ExpectedPattern "analysis_complete|completed"

# Test 2.4: Forward slashes in path
$forwardSlashPath = $TEST_DIR.Replace('\', '/')
Test-WrapperCommand `
    -TestName "2.4: Forward slashes in path" `
    -Command "$WRAPPER analyze `"$forwardSlashPath/simple.py`" --profile standard --format json" `
    -ExpectedPattern "analysis_complete|completed"

# ============================================================================
# TEST CATEGORY 3: Error Handling
# ============================================================================
Write-TestHeader "Category 3: Error Handling Tests"

# Test 3.1: Non-existent file
Test-WrapperCommand `
    -TestName "3.1: Non-existent file" `
    -Command "$WRAPPER analyze `"$TEST_DIR\missing.py`" --profile standard --format json" `
    -ShouldFail $true

# Test 3.2: Invalid policy
Test-WrapperCommand `
    -TestName "3.2: Invalid policy name" `
    -Command "$WRAPPER analyze `"$TEST_DIR\simple.py`" --profile INVALID_POLICY --format json" `
    -ShouldFail $true

# Test 3.3: Empty filename
Test-WrapperCommand `
    -TestName "3.3: Empty filename" `
    -Command "$WRAPPER analyze `"`" --profile standard --format json" `
    -ShouldFail $true

# Test 3.4: No arguments
Test-WrapperCommand `
    -TestName "3.4: No arguments (should show help)" `
    -Command "$WRAPPER" `
    -ShouldFail $true

# Test 3.5: Missing required argument (no file)
Test-WrapperCommand `
    -TestName "3.5: Missing file argument" `
    -Command "$WRAPPER analyze --profile standard --format json" `
    -ShouldFail $true

# ============================================================================
# TEST CATEGORY 4: Argument Variations
# ============================================================================
Write-TestHeader "Category 4: Argument Variations"

# Test 4.1: Multiple spaces between args
Test-WrapperCommand `
    -TestName "4.1: Multiple spaces between args" `
    -Command "$WRAPPER analyze `"$TEST_DIR\simple.py`"  --profile  standard  --format  json" `
    -ExpectedPattern "analysis_complete|completed"

# Test 4.2: Verbose flag
Test-WrapperCommand `
    -TestName "4.2: Verbose flag" `
    -Command "$WRAPPER analyze `"$TEST_DIR\simple.py`" --profile standard --format json --verbose" `
    -ExpectedPattern "Running connascence analysis"

# Test 4.3: Dry-run mode
Test-WrapperCommand `
    -TestName "4.3: Dry-run mode" `
    -Command "$WRAPPER analyze `"$TEST_DIR\simple.py`" --profile standard --format json --dry-run" `
    -ExpectedPattern "Dry run mode"

# Test 4.4: Output file specification
$outputFile = "$TEST_DIR\output-test.json"
Test-WrapperCommand `
    -TestName "4.4: Output file specification" `
    -Command "$WRAPPER analyze `"$TEST_DIR\simple.py`" --profile standard --format json --output `"$outputFile`"" `
    -ExpectedPattern "Results written to"

# Clean up output file
if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
}

# ============================================================================
# TEST CATEGORY 5: Performance Tests
# ============================================================================
Write-TestHeader "Category 5: Performance Benchmarks"

# Create larger test file
$largeFile = "$TEST_DIR\large-test.py"
$largeContent = "# Large test file`n"
for ($i = 1; $i -le 500; $i++) {
    $largeContent += "def function_$i(x, y):`n    return x + y + $i`n`n"
}
Set-Content -Path $largeFile -Value $largeContent

# Test 5.1: Small file performance
$perf1 = Measure-Command {
    & cmd /c "$WRAPPER analyze `"$TEST_DIR\simple.py`" --profile standard --format json 2>&1" | Out-Null
}
Write-Host "  [INFO] Small file (8 LOC): $($perf1.TotalMilliseconds)ms" -ForegroundColor Cyan

# Test 5.2: Large file performance
$perf2 = Measure-Command {
    & cmd /c "$WRAPPER analyze `"$largeFile`" --profile standard --format json 2>&1" | Out-Null
}
Write-Host "  [INFO] Large file (1500 LOC): $($perf2.TotalMilliseconds)ms" -ForegroundColor Cyan

# Performance evaluation
if ($perf1.TotalMilliseconds -lt 2000) {
    Write-Pass "Small file performance: $($perf1.TotalMilliseconds)ms < 2000ms threshold"
} else {
    Write-Fail "Small file performance: $($perf1.TotalMilliseconds)ms >= 2000ms threshold"
}

if ($perf2.TotalMilliseconds -lt 5000) {
    Write-Pass "Large file performance: $($perf2.TotalMilliseconds)ms < 5000ms threshold"
} else {
    Write-Warn "Large file performance: $($perf2.TotalMilliseconds)ms >= 5000ms threshold"
}

# ============================================================================
# RESULTS SUMMARY
# ============================================================================
Write-Host "`n" -NoNewline
Write-TestHeader "Test Results Summary"

$totalTests = $RESULTS.Count
$passedTests = ($RESULTS | Where-Object { $_.Passed -eq $true }).Count
$failedTests = $totalTests - $passedTests
$passRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }

Write-Host "`nTotal Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } else { "Yellow" })

# Category breakdown
Write-Host "`nTest Categories:" -ForegroundColor White
Write-Host "  1. Argument Translation: $($RESULTS | Where-Object { $_.Test -like '1.*' } | Measure-Object).Count tests"
Write-Host "  2. Special Characters: $($RESULTS | Where-Object { $_.Test -like '2.*' } | Measure-Object).Count tests"
Write-Host "  3. Error Handling: $($RESULTS | Where-Object { $_.Test -like '3.*' } | Measure-Object).Count tests"
Write-Host "  4. Argument Variations: $($RESULTS | Where-Object { $_.Test -like '4.*' } | Measure-Object).Count tests"
Write-Host "  5. Performance: 2 benchmarks"

# Failed tests detail
if ($failedTests -gt 0) {
    Write-Host "`nFailed Tests Detail:" -ForegroundColor Red
    $RESULTS | Where-Object { $_.Passed -eq $false } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Reason)" -ForegroundColor Red
    }
}

# Export results to JSON
$reportFile = "$TEST_DIR\..\wrapper-test-results.json"
$RESULTS | ConvertTo-Json -Depth 3 | Set-Content -Path $reportFile
Write-Host "`nDetailed results exported to: $reportFile" -ForegroundColor Cyan

# Performance summary
Write-Host "`nPerformance Summary:" -ForegroundColor White
Write-Host "  Average test duration: $([math]::Round(($RESULTS | Measure-Object -Property Duration -Average).Average, 2))ms"
Write-Host "  Fastest test: $([math]::Round(($RESULTS | Measure-Object -Property Duration -Minimum).Minimum, 2))ms"
Write-Host "  Slowest test: $([math]::Round(($RESULTS | Measure-Object -Property Duration -Maximum).Maximum, 2))ms"

# Exit with appropriate code
exit $(if ($passRate -ge 80) { 0 } else { 1 })
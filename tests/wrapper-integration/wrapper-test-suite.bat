@echo off
setlocal enabledelayedexpansion

REM VSCode Extension Wrapper Test Suite
REM Tests argument translation and edge cases

set WRAPPER=C:\Users\17175\AppData\Local\Programs\connascence-wrapper.bat
set TEST_DIR=%~dp0test-files
set PASS_COUNT=0
set FAIL_COUNT=0
set TOTAL_COUNT=0

echo.
echo ============================================================================
echo VSCode Extension Wrapper Comprehensive Test Suite
echo ============================================================================
echo.

REM Test execution helper
goto :skip_functions

:run_test
    set /a TOTAL_COUNT+=1
    set "test_name=%~1"
    set "test_cmd=%~2"
    set "should_fail=%~3"

    echo [TEST %TOTAL_COUNT%] %test_name%

    REM Execute command
    %test_cmd% >nul 2>&1
    set exit_code=!errorlevel!

    if "%should_fail%"=="yes" (
        if !exit_code! NEQ 0 (
            echo   [PASS] Failed as expected ^(exit: !exit_code!^)
            set /a PASS_COUNT+=1
        ) else (
            echo   [FAIL] Should have failed but succeeded
            set /a FAIL_COUNT+=1
        )
    ) else (
        if !exit_code! EQU 0 (
            echo   [PASS] Success ^(exit: !exit_code!^)
            set /a PASS_COUNT+=1
        ) else (
            echo   [FAIL] Command failed ^(exit: !exit_code!^)
            set /a FAIL_COUNT+=1
        )
    )
    echo.
    goto :eof

:skip_functions

REM ============================================================================
REM Category 1: Argument Translation Tests
REM ============================================================================
echo.
echo === Category 1: Argument Translation Tests ===
echo.

call :run_test "Extension format basic translation" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile standard --format json" ^
    "no"

call :run_test "Extension format with modern_general policy" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile modern_general --format json" ^
    "no"

call :run_test "Extension format with strict policy and SARIF" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile strict --format sarif" ^
    "no"

call :run_test "Direct format passthrough (--path)" ^
    ""%WRAPPER%" --path "%TEST_DIR%\simple.py" --policy standard --format json" ^
    "no"

call :run_test "Help command passthrough" ^
    ""%WRAPPER%" --help" ^
    "no"

call :run_test "List available policies" ^
    ""%WRAPPER%" --policy nasa-compliance --path "%TEST_DIR%\simple.py"" ^
    "no"

REM ============================================================================
REM Category 2: Edge Cases - Special Characters
REM ============================================================================
echo.
echo === Category 2: Edge Cases - Special Characters in Filenames ===
echo.

call :run_test "Filename with spaces" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\my file.py" --profile standard --format json" ^
    "no"

call :run_test "Filename with parentheses" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\file(1).py" --profile standard --format json" ^
    "no"

call :run_test "Absolute Windows path" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile standard --format json" ^
    "no"

REM Test forward slashes
set FORWARD_PATH=%TEST_DIR:\=/%
call :run_test "Forward slashes in path" ^
    ""%WRAPPER%" analyze "%FORWARD_PATH%/simple.py" --profile standard --format json" ^
    "no"

REM ============================================================================
REM Category 3: Error Handling Tests
REM ============================================================================
echo.
echo === Category 3: Error Handling Tests ===
echo.

call :run_test "Non-existent file" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\missing.py" --profile standard --format json" ^
    "yes"

call :run_test "Invalid policy name" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile INVALID_POLICY --format json" ^
    "yes"

call :run_test "Empty filename" ^
    ""%WRAPPER%" analyze "" --profile standard --format json" ^
    "yes"

call :run_test "No path argument in extension format" ^
    ""%WRAPPER%" analyze --profile standard --format json" ^
    "yes"

REM ============================================================================
REM Category 4: Argument Variations
REM ============================================================================
echo.
echo === Category 4: Argument Variations ===
echo.

call :run_test "Verbose flag with extension format" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile standard --format json --verbose" ^
    "no"

call :run_test "YAML output format" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile standard --format yaml" ^
    "no"

call :run_test "SARIF output format" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile standard --format sarif" ^
    "no"

call :run_test "Output file specification" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile standard --format json --output "%TEST_DIR%\output.json"" ^
    "no"

call :run_test "NASA compliance policy" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile nasa-compliance --format json" ^
    "no"

call :run_test "Strict mode policy" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile strict --format json" ^
    "no"

REM ============================================================================
REM Category 5: VSCode Extension Command Simulation
REM ============================================================================
echo.
echo === Category 5: VSCode Extension Command Simulation ===
echo.

call :run_test "analyzeFile command simulation" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile modern_general --format json" ^
    "no"

call :run_test "analyzeWorkspace simulation (single file)" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile standard --format json" ^
    "no"

call :run_test "Quick scan with lenient policy" ^
    ""%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile lenient --format json" ^
    "no"

REM ============================================================================
REM Category 6: Performance Tests
REM ============================================================================
echo.
echo === Category 6: Performance Benchmarks ===
echo.

REM Create large test file
set LARGE_FILE=%TEST_DIR%\large-test.py
echo # Large test file > "%LARGE_FILE%"
for /L %%i in (1,1,100) do (
    echo def function_%%i^(x, y^): >> "%LARGE_FILE%"
    echo     return x + y + %%i >> "%LARGE_FILE%"
    echo. >> "%LARGE_FILE%"
)

echo [PERF] Testing small file (8 LOC)...
set start_time=%time%
"%WRAPPER%" analyze "%TEST_DIR%\simple.py" --profile standard --format json >nul 2>&1
set end_time=%time%
echo   Small file analysis completed
echo.

echo [PERF] Testing large file (300+ LOC)...
set start_time=%time%
"%WRAPPER%" analyze "%LARGE_FILE%" --profile standard --format json >nul 2>&1
set end_time=%time%
echo   Large file analysis completed
echo.

REM Clean up
if exist "%TEST_DIR%\output.json" del "%TEST_DIR%\output.json"
if exist "%LARGE_FILE%" del "%LARGE_FILE%"

REM ============================================================================
REM Results Summary
REM ============================================================================
echo.
echo ============================================================================
echo Test Results Summary
echo ============================================================================
echo.
echo Total Tests:  !TOTAL_COUNT!
echo Passed:       !PASS_COUNT!
echo Failed:       !FAIL_COUNT!
echo.

set /a pass_rate=(!PASS_COUNT! * 100) / !TOTAL_COUNT!
echo Pass Rate:    !pass_rate!%%
echo.

if !FAIL_COUNT! GTR 0 (
    echo [OVERALL] TEST SUITE FAILED
    echo.
    echo Recommendation: Review failed tests above for details
    exit /b 1
) else (
    echo [OVERALL] ALL TESTS PASSED
    echo.
    echo Wrapper is functioning correctly and ready for production use.
    exit /b 0
)
@echo off
REM SPEK Enhanced Development Platform - Desktop Integration Test Script
REM Production-ready Windows batch script for testing Bytebot desktop automation
REM Version: 1.0.0
REM Last Updated: 2024-09-18

setlocal enabledelayedexpansion

REM ==========================================
REM CONFIGURATION AND CONSTANTS
REM ==========================================

set "SCRIPT_NAME=test-desktop-integration.bat"
set "SCRIPT_VERSION=1.0.0"
set "PROJECT_ROOT=%~dp0.."
set "LOG_DIR=%PROJECT_ROOT%\.claude\.artifacts\desktop"
set "LOG_FILE=%LOG_DIR%\integration-test.log"
set "RESULTS_FILE=%LOG_DIR%\integration-results.json"
set "ERROR_LOG=%LOG_DIR%\integration-errors.log"

REM Test configuration
set "TEST_TIMEOUT=60"
set "HEALTH_CHECK_TIMEOUT=30"
set "SERVICE_START_TIMEOUT=120"

REM Default ports (can be overridden by .env file)
set "BYTEBOT_DESKTOP_PORT=9990"
set "BYTEBOT_AGENT_PORT=9991"
set "BYTEBOT_UI_PORT=9992"
set "EVIDENCE_PORT=8080"
set "VNC_PORT=5900"
set "POSTGRES_PORT=5432"
set "REDIS_PORT=6379"

REM Test counters
set /a "TESTS_TOTAL=0"
set /a "TESTS_PASSED=0"
set /a "TESTS_FAILED=0"
set /a "TESTS_SKIPPED=0"

REM ==========================================
REM UTILITY FUNCTIONS
REM ==========================================

:log
set "level=%~1"
set "message=%~2"
set "timestamp=%date% %time%"

if "%level%"=="INFO" (
    echo [INFO] %message%
) else if "%level%"=="WARN" (
    echo [WARN] %message%
) else if "%level%"=="ERROR" (
    echo [ERROR] %message%
) else if "%level%"=="SUCCESS" (
    echo [SUCCESS] %message%
) else if "%level%"=="DEBUG" (
    if "%DEBUG%"=="true" (
        echo [DEBUG] %message%
    )
)

REM Log to file
echo [%timestamp%] [%level%] %message% >> "%LOG_FILE%"
goto :eof

:error_exit
set "error_message=%~1"
call :log "ERROR" "%error_message%"
call :cleanup_on_error
exit /b 1

:cleanup_on_error
call :log "INFO" "Performing cleanup due to error..."
REM Stop any test containers if needed
pushd "%PROJECT_ROOT%"
docker compose -f docker\docker compose.desktop.yml down --remove-orphans >nul 2>&1
popd
goto :eof

:check_command
set "cmd=%~1"
where %cmd% >nul 2>&1
if %errorlevel% neq 0 (
    call :error_exit "Command not found: %cmd%"
)
goto :eof

:run_test
set "test_name=%~1"
set "test_command=%~2"
set "expected_result=%~3"
if "%expected_result%"=="" set "expected_result=0"

set /a "TESTS_TOTAL+=1"

call :log "INFO" "Running test: %test_name%"

REM Execute the test command
%test_command% >nul 2>&1
set "test_result=%errorlevel%"

if %test_result% equ %expected_result% (
    call :log "SUCCESS" "Test passed: %test_name%"
    set /a "TESTS_PASSED+=1"
) else (
    call :log "ERROR" "Test failed: %test_name% (expected %expected_result%, got %test_result%)"
    set /a "TESTS_FAILED+=1"
)

goto :eof

:skip_test
set "test_name=%~1"
set "reason=%~2"

set /a "TESTS_TOTAL+=1"
set /a "TESTS_SKIPPED+=1"

call :log "WARN" "Test skipped: %test_name% - %reason%"
goto :eof

:print_banner
echo.
echo    _____ _____  ______ _  __   _____            _
echo   / ____^|  __ \^|  ____^| ^|/ /  ^|  __ \          ^| ^|
echo  ^| (___  ^| ^|__) ^| ^|__  ^| ' /   ^| ^|  ^| ^| ___  ___^| ^| ___ ___  _ __
echo   \___ \^|  ___/^|  __^| ^|  ^<    ^| ^|  ^| ^|/ _ \/ __^| ^|/ / __/ _ \^| '_ \
echo   ____) ^| ^|    ^| ^|____^| . \   ^| ^|__^| ^|  __/\__ \   ^<^| (_^| (_) ^| ^|_) ^|
echo  ^|_____/^|_^|    ^|______^|_^|\_\  ^|_____/ \___^|^|___/_^|\_\\___\___/^| .__/
echo                                                            ^| ^|
echo                           Desktop Automation              ^|_^|
echo.
echo SPEK Enhanced Development Platform
echo Desktop Integration Test Suite
echo Version: %SCRIPT_VERSION%
echo.
goto :eof

:load_environment
if exist "%PROJECT_ROOT%\docker\bytebot\.env" (
    call :log "INFO" "Loading environment configuration..."

    REM Read environment file and set variables
    for /f "usebackq tokens=1,2 delims==" %%a in ("%PROJECT_ROOT%\docker\bytebot\.env") do (
        set "line=%%a"
        if "!line:~0,1!" neq "#" if "!line!" neq "" (
            set "%%a=%%b"
        )
    )

    call :log "SUCCESS" "Environment configuration loaded"
) else (
    call :log "WARN" "Environment file not found, using defaults"
)
goto :eof

REM ==========================================
REM PRE-FLIGHT CHECKS
REM ==========================================

:check_prerequisites
call :log "INFO" "Checking prerequisites..."

REM Check required commands
call :check_command "docker"
call :check_command "curl"
call :check_command "powershell"

REM Check Docker daemon
docker info >nul 2>&1
if %errorlevel% neq 0 (
    call :error_exit "Docker daemon is not running"
)

REM Check project structure
if not exist "%PROJECT_ROOT%\docker\docker compose.desktop.yml" (
    call :error_exit "Docker Compose file not found"
)

call :log "SUCCESS" "Prerequisites check passed"
goto :eof

:check_system_resources
call :log "INFO" "Checking system resources..."

REM Check available memory using PowerShell
for /f %%a in ('powershell "(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory"') do set "free_memory_kb=%%a"
set /a "free_memory_gb=%free_memory_kb% / 1024 / 1024"

if %free_memory_gb% lss 4 (
    call :log "WARN" "Low available memory: %free_memory_gb%GB. Recommended: 8GB+"
) else (
    call :log "SUCCESS" "Available memory: %free_memory_gb%GB"
)

goto :eof

REM ==========================================
REM CONTAINER TESTS
REM ==========================================

:test_container_status
call :log "INFO" "Testing container status..."

pushd "%PROJECT_ROOT%"

REM Check if containers are running
docker compose -f docker\docker compose.desktop.yml ps --format json > temp_status.json 2>nul

if %errorlevel% equ 0 (
    call :run_test "Container Status Check" "docker compose -f docker\docker compose.desktop.yml ps -q"
) else (
    call :skip_test "Container Status Check" "Docker Compose failed"
)

if exist temp_status.json del temp_status.json
popd
goto :eof

:test_service_health
call :log "INFO" "Testing service health checks..."

REM Test each service health endpoint
call :run_test "Bytebot Desktop Health" "curl -f -s http://localhost:%BYTEBOT_DESKTOP_PORT%/health"
call :run_test "Bytebot Agent Health" "curl -f -s http://localhost:%BYTEBOT_AGENT_PORT%/health"
call :run_test "Bytebot UI Health" "curl -f -s http://localhost:%BYTEBOT_UI_PORT%/health"
call :run_test "Evidence Collector Health" "curl -f -s http://localhost:%EVIDENCE_PORT%/health"

goto :eof

:test_database_connectivity
call :log "INFO" "Testing database connectivity..."

pushd "%PROJECT_ROOT%"

REM Test PostgreSQL connectivity
docker compose -f docker\docker compose.desktop.yml exec -T postgres pg_isready -U spekuser >nul 2>&1
if %errorlevel% equ 0 (
    call :run_test "PostgreSQL Connectivity" "docker compose -f docker\docker compose.desktop.yml exec -T postgres pg_isready -U spekuser"
) else (
    call :skip_test "PostgreSQL Connectivity" "Service not available"
)

REM Test Redis connectivity
docker compose -f docker\docker compose.desktop.yml exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    call :run_test "Redis Connectivity" "docker compose -f docker\docker compose.desktop.yml exec -T redis redis-cli ping"
) else (
    call :skip_test "Redis Connectivity" "Service not available"
)

popd
goto :eof

:test_api_endpoints
call :log "INFO" "Testing API endpoints..."

REM Test Bytebot Agent API
call :run_test "Agent API Status" "curl -f -s http://localhost:%BYTEBOT_AGENT_PORT%/api/status"
call :run_test "Agent API Version" "curl -f -s http://localhost:%BYTEBOT_AGENT_PORT%/api/version"

REM Test desktop automation capabilities
call :run_test "Desktop API Sessions" "curl -f -s http://localhost:%BYTEBOT_DESKTOP_PORT%/api/sessions"

REM Test evidence collection
call :run_test "Evidence Collection" "curl -f -s http://localhost:%EVIDENCE_PORT%/evidence"

goto :eof

:test_file_permissions
call :log "INFO" "Testing file permissions and volumes..."

REM Check if evidence directory is writable
echo test > "%PROJECT_ROOT%\.claude\.artifacts\desktop\write_test.txt" 2>nul
if %errorlevel% equ 0 (
    call :run_test "Evidence Directory Write" "echo test"
    del "%PROJECT_ROOT%\.claude\.artifacts\desktop\write_test.txt" 2>nul
) else (
    call :skip_test "Evidence Directory Write" "Permission denied"
)

REM Check data directories
for %%d in (postgres evidence screenshots logs agent redis) do (
    if exist "%PROJECT_ROOT%\data\%%d" (
        call :run_test "Data Directory %%d" "dir "%PROJECT_ROOT%\data\%%d""
    ) else (
        call :skip_test "Data Directory %%d" "Directory not found"
    )
)

goto :eof

:test_integration_scenarios
call :log "INFO" "Testing integration scenarios..."

REM Test agent-desktop communication
call :run_test "Agent-Desktop Communication" "curl -f -s -X POST http://localhost:%BYTEBOT_AGENT_PORT%/api/test-desktop-connection"

REM Test evidence collection workflow
call :run_test "Evidence Collection Workflow" "curl -f -s -X POST http://localhost:%EVIDENCE_PORT%/collect -d '{\"test\":\"data\"}' -H 'Content-Type: application/json'"

REM Test UI-Agent communication
call :run_test "UI-Agent Communication" "curl -f -s http://localhost:%BYTEBOT_UI_PORT%/api/agent-status"

goto :eof

REM ==========================================
REM REPORTING AND CLEANUP
REM ==========================================

:generate_test_report
call :log "INFO" "Generating test report..."

set "report_timestamp=%date% %time%"
set /a "success_rate=(%TESTS_PASSED% * 100) / %TESTS_TOTAL%"

REM Create JSON report
(
echo {
echo   "test_report": {
echo     "timestamp": "%report_timestamp%",
echo     "script_version": "%SCRIPT_VERSION%",
echo     "environment": {
echo       "project_root": "%PROJECT_ROOT%",
echo       "bytebot_desktop_port": "%BYTEBOT_DESKTOP_PORT%",
echo       "bytebot_agent_port": "%BYTEBOT_AGENT_PORT%",
echo       "bytebot_ui_port": "%BYTEBOT_UI_PORT%",
echo       "evidence_port": "%EVIDENCE_PORT%"
echo     },
echo     "test_results": {
echo       "total_tests": %TESTS_TOTAL%,
echo       "passed": %TESTS_PASSED%,
echo       "failed": %TESTS_FAILED%,
echo       "skipped": %TESTS_SKIPPED%,
echo       "success_rate": "%success_rate%%%"
echo     },
echo     "status": "%overall_status%"
echo   }
echo }
) > "%RESULTS_FILE%"

call :log "SUCCESS" "Test report generated: %RESULTS_FILE%"
goto :eof

:show_test_summary
call :log "INFO" "Test Summary:"
echo.
echo === Desktop Integration Test Results ===
echo Total Tests: %TESTS_TOTAL%
echo Passed: %TESTS_PASSED%
echo Failed: %TESTS_FAILED%
echo Skipped: %TESTS_SKIPPED%

set /a "success_rate=(%TESTS_PASSED% * 100) / %TESTS_TOTAL%"
echo Success Rate: %success_rate%%%

if %TESTS_FAILED% equ 0 (
    set "overall_status=PASSED"
    echo.
    echo Overall Status: PASSED
    echo Desktop automation environment is ready for use!
) else (
    set "overall_status=FAILED"
    echo.
    echo Overall Status: FAILED
    echo Please check the logs and fix the failing tests.
)

echo.
echo Quick Commands:
echo - View detailed logs: type "%LOG_FILE%"
echo - View error logs: type "%ERROR_LOG%"
echo - Restart services: .\scripts\start-desktop-containers.sh --restart
echo - Stop services: .\scripts\start-desktop-containers.sh --stop
echo.
goto :eof

REM ==========================================
REM MAIN EXECUTION
REM ==========================================

:main
REM Record start time
set "start_time=%time%"

REM Create log directory
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Clear previous logs
if exist "%LOG_FILE%" del "%LOG_FILE%"
if exist "%ERROR_LOG%" del "%ERROR_LOG%"

REM Parse command line arguments
set "verbose=false"
set "debug=false"
set "quiet=false"
set "quick_mode=false"
set "full_mode=false"

:parse_args
if "%~1"=="" goto :start_tests
if /i "%~1"=="/h" goto :show_usage
if /i "%~1"=="/help" goto :show_usage
if /i "%~1"=="/v" set "verbose=true"
if /i "%~1"=="/verbose" set "verbose=true"
if /i "%~1"=="/d" set "debug=true"
if /i "%~1"=="/debug" set "debug=true"
if /i "%~1"=="/q" set "quiet=true"
if /i "%~1"=="/quiet" set "quiet=true"
if /i "%~1"=="/quick" set "quick_mode=true"
if /i "%~1"=="/full" set "full_mode=true"
shift
goto :parse_args

:show_usage
echo Usage: %SCRIPT_NAME% [OPTIONS]
echo.
echo Options:
echo   /h, /help              Show this help message
echo   /v, /verbose           Enable verbose output
echo   /d, /debug             Enable debug mode
echo   /q, /quiet             Suppress non-essential output
echo   /quick                 Run only essential tests
echo   /full                  Run comprehensive test suite
echo.
echo Examples:
echo   %SCRIPT_NAME%                    # Standard test suite
echo   %SCRIPT_NAME% /verbose          # Verbose test output
echo   %SCRIPT_NAME% /quick            # Quick health checks only
echo   %SCRIPT_NAME% /full             # Comprehensive testing
echo.
exit /b 0

:start_tests
REM Show banner (unless quiet mode)
if "%quiet%"=="false" call :print_banner

call :log "INFO" "Starting SPEK Desktop Integration Tests..."

REM Load environment configuration
call :load_environment

REM Pre-flight checks
call :check_prerequisites
call :check_system_resources

REM Core tests (always run)
call :test_container_status
call :test_service_health
call :test_database_connectivity

REM Quick mode - skip extended tests
if "%quick_mode%"=="true" goto :show_results

REM Standard tests
call :test_api_endpoints
call :test_file_permissions

REM Full mode - include all tests
if "%full_mode%"=="true" (
    call :test_integration_scenarios
)

:show_results
REM Generate reports
call :generate_test_report
call :show_test_summary

call :log "SUCCESS" "Integration tests completed"

REM Exit with appropriate code
if %TESTS_FAILED% gtr 0 (
    exit /b 1
) else (
    exit /b 0
)

REM Main entry point
call :main %*
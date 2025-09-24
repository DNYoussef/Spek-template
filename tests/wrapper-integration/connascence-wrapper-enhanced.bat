@echo off
setlocal enabledelayedexpansion

REM Enhanced VSCode Extension Wrapper for Connascence CLI
REM Version: 1.1.0
REM Fixes: Proper quoting, special character handling, validation
REM
REM Extension Format: connascence analyze filepath --profile X --format json
REM CLI Format:       connascence --path filepath --policy X --format json

set "CONNASCENCE_EXE=C:\Users\17175\AppData\Roaming\Python\Python312\Scripts\connascence.exe"

REM Debug mode - set CONNASCENCE_DEBUG=1 to enable
if defined CONNASCENCE_DEBUG (
    echo [DEBUG] Wrapper v1.1.0
    echo [DEBUG] Input arguments: %*
)

REM Version flag
if /i "%~1"=="--wrapper-version" (
    echo VSCode Connascence Wrapper v1.1.0
    echo CLI Executable: %CONNASCENCE_EXE%
    exit /b 0
)

REM Check if extension format (starts with "analyze")
if /i "%~1"=="analyze" (
    REM ===================================================================
    REM Extension Format Translation
    REM ===================================================================

    REM Extract filepath (2nd argument)
    set "filepath=%~2"

    REM Validate filepath exists
    if not defined filepath (
        echo [ERROR] No file specified for analysis 1>&2
        echo Usage: connascence analyze ^<filepath^> --profile ^<policy^> --format ^<format^> 1>&2
        exit /b 1
    )

    if not exist "!filepath!" (
        echo [ERROR] File not found: !filepath! 1>&2
        exit /b 1
    )

    REM Start building command with properly quoted path
    set "cmd_line=--path "!filepath!""

    REM Process remaining arguments (skip "analyze" and filepath)
    set "arg_index=0"
    set "in_profile=0"

    for %%a in (%*) do (
        set /a arg_index+=1

        REM Skip first two args (analyze and filepath)
        if !arg_index! GTR 2 (
            set "current_arg=%%~a"

            REM Detect --profile and translate to --policy
            if "!current_arg!"=="--profile" (
                set "cmd_line=!cmd_line! --policy"
                set "in_profile=1"
            ) else (
                REM Handle special characters in arguments
                set "safe_arg=!current_arg!"

                REM Escape batch special characters
                set "safe_arg=!safe_arg:(=^(!"
                set "safe_arg=!safe_arg:)=^)!"
                set "safe_arg=!safe_arg:&=^&!"

                REM Add argument with quotes if it contains spaces
                echo "!safe_arg!" | findstr /C:" " >nul
                if !errorlevel! EQU 0 (
                    set "cmd_line=!cmd_line! "!safe_arg!""
                ) else (
                    set "cmd_line=!cmd_line! !safe_arg!"
                )
            )
        )
    )

    if defined CONNASCENCE_DEBUG (
        echo [DEBUG] Filepath: !filepath!
        echo [DEBUG] Translated command: !cmd_line!
    )

    REM Execute translated command
    "%CONNASCENCE_EXE%" !cmd_line!
    set "exit_code=!errorlevel!"

    if defined CONNASCENCE_DEBUG (
        echo [DEBUG] Exit code: !exit_code!
    )

    exit /b !exit_code!

) else (
    REM ===================================================================
    REM Direct Format Passthrough
    REM ===================================================================

    if defined CONNASCENCE_DEBUG (
        echo [DEBUG] Direct passthrough mode
        echo [DEBUG] Arguments: %*
    )

    REM Pass through arguments unchanged
    "%CONNASCENCE_EXE%" %*
    exit /b !errorlevel!
)
#!/bin/bash
# Windows Compatibility Layer for Post-Completion Cleanup

# Detect Windows environment
is_windows() {
    [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]] || [[ -n "${MSYSTEM:-}" ]]
}

# Convert Windows paths to Unix paths
win_to_unix_path() {
    local path="$1"
    if is_windows; then
        # Convert C:\path to /c/path
        echo "$path" | sed 's|^\([A-Za-z]\):|/\L\1|' | tr '\\' '/'
    else
        echo "$path"
    fi
}

# Convert Unix paths to Windows paths  
unix_to_win_path() {
    local path="$1"
    if is_windows; then
        # Convert /c/path to C:\path
        echo "$path" | sed 's|^/\([a-z]\)/|\U\1:/|' | tr '/' '\\'
    else
        echo "$path"
    fi
}

# Cross-platform file operations
safe_rm() {
    local target="$1"
    if is_windows; then
        # Use Windows-compatible removal
        if [[ -d "$target" ]]; then
            rm -rf "$target" 2>/dev/null || rmdir /s /q "$(unix_to_win_path "$target")" 2>/dev/null || true
        else
            rm -f "$target" 2>/dev/null || del /f "$(unix_to_win_path "$target")" 2>/dev/null || true
        fi
    else
        rm -rf "$target"
    fi
}

# Cross-platform directory creation
safe_mkdir() {
    local dir="$1"
    if is_windows; then
        mkdir -p "$dir" 2>/dev/null || mkdir "$(unix_to_win_path "$dir")" 2>/dev/null || true
    else
        mkdir -p "$dir"
    fi
}

# Export functions for use in other scripts
export -f is_windows win_to_unix_path unix_to_win_path safe_rm safe_mkdir

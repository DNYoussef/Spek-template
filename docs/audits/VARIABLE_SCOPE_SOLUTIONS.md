# Bash Variable Scope Issue: EXACT SOLUTION

## THE PROBLEM

The issue was **NOT** variable scope - it was **arithmetic expansion behavior with `set -e`**.

When you use `((COUNTER++))` and COUNTER starts at 0:
1. The increment happens: COUNTER becomes 1
2. The expression evaluates the OLD value: 0
3. **Exit code is 1 because the result (0) is false**
4. With `set -e`, exit code 1 terminates the script

## SOLUTION 1: Safe Arithmetic with `:` Command (RECOMMENDED)

```bash
#!/bin/bash
set -e

TOTAL_CHECKS=0
PASSED_CHECKS=0

test_endpoint() {
    local url="$1"
    local name="$2"

    # FIXED: Use : command to ignore exit code
    : $((TOTAL_CHECKS++))

    # Test logic here...
    if some_test_passes; then
        : $((PASSED_CHECKS++))
    fi
}

# Initialize variables (order doesn't matter in bash)
TOTAL_CHECKS=0
PASSED_CHECKS=0

test_endpoint "url" "name"
```

## SOLUTION 2: Alternative Assignment Pattern

```bash
#!/bin/bash
set -e

test_endpoint() {
    local url="$1"
    local name="$2"

    # FIXED: Use assignment instead of compound increment
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    # Test logic here...
    if some_test_passes; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
}

TOTAL_CHECKS=0
PASSED_CHECKS=0

test_endpoint "url" "name"
```

## SOLUTION 3: Disable set -e Temporarily

```bash
#!/bin/bash
set -e

test_endpoint() {
    local url="$1"
    local name="$2"

    # FIXED: Temporarily disable set -e for increment
    set +e
    ((TOTAL_CHECKS++))
    set -e

    # Test logic here...
}

TOTAL_CHECKS=0
PASSED_CHECKS=0

test_endpoint "url" "name"
```

## WHY VARIABLE SCOPE IS NOT THE ISSUE

In bash, variables are **automatically global** unless declared with `local`. The order of initialization vs function definition **does not matter**:

```bash
# These are EQUIVALENT in bash:

# Method A: Function first
test_func() { echo $VAR; }
VAR=5
test_func  # Prints: 5

# Method B: Variable first
VAR=5
test_func() { echo $VAR; }
test_func  # Prints: 5
```

## THE EXACT FIX FOR YOUR SCRIPT

Replace this:
```bash
((TOTAL_CHECKS++))  # FAILS with set -e when TOTAL_CHECKS=0
```

With this:
```bash
: $((TOTAL_CHECKS++))  # ALWAYS SUCCEEDS
```

## Root Cause Summary

- **Problem**: `((expr++))` returns exit code based on OLD value
- **Trigger**: `set -e` exits on any non-zero exit code
- **Solution**: Use `: $((expr++))` or `VAR=$((VAR + 1))`
- **Variable scope**: Was never the issue - bash variables are global by default
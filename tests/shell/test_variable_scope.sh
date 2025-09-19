#!/bin/bash

# Test script to identify variable scope issues in bash functions
# Mimics GitHub Actions environment with set -e

set -e  # Exit on any error - THIS IS KEY!

echo "=== BASH VARIABLE SCOPE TEST ==="
echo ""

# Test 1: Variables declared before function
echo "Test 1: Variables declared BEFORE function definition"
TOTAL_CHECKS_1=0
PASSED_CHECKS_1=0

test_function_1() {
    echo "  Inside function 1:"
    echo "    TOTAL_CHECKS_1 = $TOTAL_CHECKS_1"
    echo "    PASSED_CHECKS_1 = $PASSED_CHECKS_1"
    ((TOTAL_CHECKS_1++))
    echo "    After increment: TOTAL_CHECKS_1 = $TOTAL_CHECKS_1"
}

echo "Calling test_function_1..."
test_function_1
echo "After function: TOTAL_CHECKS_1 = $TOTAL_CHECKS_1"
echo ""

# Test 2: Variables declared after function (current failing scenario)
echo "Test 2: Variables declared AFTER function definition"

test_function_2() {
    echo "  Inside function 2:"
    echo "    TOTAL_CHECKS_2 = ${TOTAL_CHECKS_2:-UNSET}"
    echo "    PASSED_CHECKS_2 = ${PASSED_CHECKS_2:-UNSET}"
    # This will fail with set -e if variable is unset!
    ((TOTAL_CHECKS_2++)) || echo "    ERROR: Increment failed!"
    echo "    After increment: TOTAL_CHECKS_2 = $TOTAL_CHECKS_2"
}

# Initialize AFTER function definition (like current script)
TOTAL_CHECKS_2=0
PASSED_CHECKS_2=0

echo "Calling test_function_2..."
test_function_2 || echo "Function 2 FAILED!"
echo "After function: TOTAL_CHECKS_2 = $TOTAL_CHECKS_2"
echo ""

# Test 3: Using declare -g (global)
echo "Test 3: Using declare -g for global variables"

test_function_3() {
    echo "  Inside function 3:"
    declare -g TOTAL_CHECKS_3=0
    declare -g PASSED_CHECKS_3=0
    echo "    TOTAL_CHECKS_3 = $TOTAL_CHECKS_3"
    ((TOTAL_CHECKS_3++))
    echo "    After increment: TOTAL_CHECKS_3 = $TOTAL_CHECKS_3"
}

echo "Calling test_function_3..."
test_function_3
echo "After function: TOTAL_CHECKS_3 = $TOTAL_CHECKS_3"
echo ""

# Test 4: Using export
echo "Test 4: Using export for environment variables"
export TOTAL_CHECKS_4=0
export PASSED_CHECKS_4=0

test_function_4() {
    echo "  Inside function 4:"
    echo "    TOTAL_CHECKS_4 = $TOTAL_CHECKS_4"
    ((TOTAL_CHECKS_4++))
    echo "    After increment: TOTAL_CHECKS_4 = $TOTAL_CHECKS_4"
}

echo "Calling test_function_4..."
test_function_4
echo "After function: TOTAL_CHECKS_4 = $TOTAL_CHECKS_4"
echo ""

# Test 5: Array variable scope
echo "Test 5: Array variable scope"
ALERTS_5=()

test_function_5() {
    echo "  Inside function 5:"
    echo "    ALERTS_5 length = ${#ALERTS_5[@]}"
    ALERTS_5+=("test alert")
    echo "    After append: ALERTS_5 length = ${#ALERTS_5[@]}"
    echo "    ALERTS_5 content = ${ALERTS_5[*]}"
}

echo "Calling test_function_5..."
test_function_5
echo "After function: ALERTS_5 length = ${#ALERTS_5[@]}"
echo "After function: ALERTS_5 content = ${ALERTS_5[*]}"
echo ""

# Test 6: The EXACT scenario from the failing script
echo "Test 6: EXACT REPRODUCTION of failing scenario"

test_endpoint_exact() {
    local url="$1"
    local name="$2"
    local timeout="${3:-30}"

    echo "  Testing $name at $url"
    echo "    TOTAL_CHECKS before increment: ${TOTAL_CHECKS_EXACT:-UNSET}"

    # This is line 101 equivalent - the failing line!
    ((TOTAL_CHECKS_EXACT++)) || {
        echo "    ERROR: ((TOTAL_CHECKS_EXACT++)) failed!"
        echo "    Variable value: '${TOTAL_CHECKS_EXACT:-UNSET}'"
        echo "    Variable type: $(declare -p TOTAL_CHECKS_EXACT 2>/dev/null || echo 'UNDECLARED')"
        return 1
    }

    echo "    TOTAL_CHECKS after increment: $TOTAL_CHECKS_EXACT"
}

# Initialize variables AFTER function (reproducing the issue)
TOTAL_CHECKS_EXACT=0
PASSED_CHECKS_EXACT=0
ALERTS_EXACT=()

echo "Variables initialized:"
echo "  TOTAL_CHECKS_EXACT = $TOTAL_CHECKS_EXACT"
echo "  Type: $(declare -p TOTAL_CHECKS_EXACT)"

echo "Calling test_endpoint_exact..."
test_endpoint_exact "http://example.com" "Example" 5 || echo "REPRODUCTION FAILED!"
echo ""

echo "=== TEST COMPLETE ==="
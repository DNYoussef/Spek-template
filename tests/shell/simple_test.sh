#!/bin/bash

set -e

echo "=== SIMPLE VARIABLE SCOPE TEST ==="

# Method 1: declare -g BEFORE function
declare -g COUNTER1=0

test_func1() {
    echo "COUNTER1 before: $COUNTER1"
    ((COUNTER1++))
    echo "COUNTER1 after: $COUNTER1"
}

echo "Method 1: declare -g before function"
test_func1
echo "Final COUNTER1: $COUNTER1"
echo

# Method 2: Regular assignment BEFORE function
COUNTER2=0

test_func2() {
    echo "COUNTER2 before: $COUNTER2"
    ((COUNTER2++))
    echo "COUNTER2 after: $COUNTER2"
}

echo "Method 2: regular assignment before function"
test_func2
echo "Final COUNTER2: $COUNTER2"
echo

# Method 3: Assignment AFTER function (reproducing the issue)
test_func3() {
    echo "COUNTER3 before: ${COUNTER3:-UNSET}"
    ((COUNTER3++)) || echo "INCREMENT FAILED!"
    echo "COUNTER3 after: $COUNTER3"
}

COUNTER3=0  # This is AFTER the function definition

echo "Method 3: assignment after function (should work in bash)"
test_func3
echo "Final COUNTER3: $COUNTER3"
echo

echo "=== TEST COMPLETE ==="
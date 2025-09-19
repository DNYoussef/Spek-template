#!/bin/bash

echo "Testing arithmetic expansion behavior"

echo "Test 1: Without set -e"
COUNTER=0
echo "COUNTER before: $COUNTER"
((COUNTER++))
echo "Exit code: $?"
echo "COUNTER after: $COUNTER"
echo

echo "Test 2: With set -e and COUNTER=0"
set -e
COUNTER=0
echo "COUNTER before: $COUNTER"
((COUNTER++)) && echo "Success" || echo "Failed"
echo "This line should not print if set -e caused exit"

echo "Test 3: Safe arithmetic with set -e"
COUNTER=0
echo "COUNTER before: $COUNTER"
: $((COUNTER++))  # : command always succeeds
echo "COUNTER after: $COUNTER"

echo "Test 4: Alternative safe increment"
COUNTER=0
echo "COUNTER before: $COUNTER"
COUNTER=$((COUNTER + 1))
echo "COUNTER after: $COUNTER"

echo "All tests completed"
#!/bin/bash

set -e  # Exit on any error

echo "Testing bash variable scope WITH set -e"

COUNTER=0

test_func() {
    echo "Inside function: COUNTER = $COUNTER"
    ((COUNTER++))
    echo "After increment: COUNTER = $COUNTER"
    return 0  # Explicit success
}

echo "Before function call: COUNTER = $COUNTER"
test_func
echo "After function call: COUNTER = $COUNTER"

echo "Test completed successfully"
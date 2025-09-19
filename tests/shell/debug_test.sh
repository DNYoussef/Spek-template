#!/bin/bash

echo "Testing bash variable scope without set -e"

COUNTER=0

test_func() {
    echo "Inside function: COUNTER = $COUNTER"
    ((COUNTER++))
    echo "After increment: COUNTER = $COUNTER"
}

echo "Before function call: COUNTER = $COUNTER"
test_func
echo "After function call: COUNTER = $COUNTER"

echo "Test completed successfully"
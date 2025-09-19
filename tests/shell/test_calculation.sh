#!/bin/bash

# Replicate exact GitHub Actions environment
set -e  # Exit on first error (like GitHub Actions)

# Test function that replicates the failing code
test_endpoint() {
    local url="$1"
    local expected_status="$2"

    echo "Testing endpoint: $url"

    # Simulate the curl response that works
    RESPONSE="200:0.199784"  # This is what curl returns successfully

    # Extract status and response time (this works)
    STATUS_CODE="${RESPONSE%:*}"
    RESPONSE_TIME="${RESPONSE#*:}"

    echo "Status: $STATUS_CODE, Response Time: $RESPONSE_TIME"

    # THIS IS THE FAILING CODE (lines 81-98)
    echo "Starting calculation..."

    # More robust calculation using bash string manipulation
    if [[ "$RESPONSE_TIME" =~ ^[0-9]+\.?[0-9]*$ ]]; then
        echo "Response time matches regex pattern"

        # Remove decimal point and pad/truncate to get milliseconds
        # e.g., 0.199784 -> 199, 1.234 -> 1234, 2 -> 2000
        TEMP=$(echo "$RESPONSE_TIME" | tr -d '.')
        echo "TEMP after tr: '$TEMP'"

        if [[ "$RESPONSE_TIME" == *"."* ]]; then
            echo "Has decimal point"
            # Has decimal - take first 3 digits after decimal
            DECIMAL_PART="${RESPONSE_TIME#*.}"
            INTEGER_PART="${RESPONSE_TIME%.*}"
            echo "INTEGER_PART: '$INTEGER_PART', DECIMAL_PART: '$DECIMAL_PART'"

            DECIMAL_PART="${DECIMAL_PART}000"  # Pad with zeros
            echo "DECIMAL_PART after padding: '$DECIMAL_PART'"

            RESPONSE_TIME_MS="${INTEGER_PART}${DECIMAL_PART:0:3}"
            echo "RESPONSE_TIME_MS: '$RESPONSE_TIME_MS'"
        else
            echo "No decimal point"
            # No decimal - multiply by 1000
            RESPONSE_TIME_MS="${RESPONSE_TIME}000"
            echo "RESPONSE_TIME_MS: '$RESPONSE_TIME_MS'"
        fi
    else
        echo "Invalid response time format"
        RESPONSE_TIME_MS="999000"  # Default for invalid input
    fi

    echo "Final RESPONSE_TIME_MS: $RESPONSE_TIME_MS"

    # Continue with the rest of the function...
    echo "Calculation completed successfully"
}

# Test with various response time values
echo "=== TEST 1: 0.199784 ==="
test_endpoint "http://localhost" "200"

echo -e "\n=== TEST 2: Testing edge cases ==="

# Test different values by modifying the RESPONSE directly
test_response_time() {
    local RESPONSE_TIME="$1"
    echo "Testing RESPONSE_TIME: '$RESPONSE_TIME'"

    # Same calculation logic
    if [[ "$RESPONSE_TIME" =~ ^[0-9]+\.?[0-9]*$ ]]; then
        echo "Response time matches regex pattern"

        TEMP=$(echo "$RESPONSE_TIME" | tr -d '.')
        echo "TEMP after tr: '$TEMP'"

        if [[ "$RESPONSE_TIME" == *"."* ]]; then
            echo "Has decimal point"
            DECIMAL_PART="${RESPONSE_TIME#*.}"
            INTEGER_PART="${RESPONSE_TIME%.*}"
            echo "INTEGER_PART: '$INTEGER_PART', DECIMAL_PART: '$DECIMAL_PART'"

            DECIMAL_PART="${DECIMAL_PART}000"
            echo "DECIMAL_PART after padding: '$DECIMAL_PART'"

            RESPONSE_TIME_MS="${INTEGER_PART}${DECIMAL_PART:0:3}"
            echo "RESPONSE_TIME_MS: '$RESPONSE_TIME_MS'"
        else
            echo "No decimal point"
            RESPONSE_TIME_MS="${RESPONSE_TIME}000"
            echo "RESPONSE_TIME_MS: '$RESPONSE_TIME_MS'"
        fi
    else
        echo "Invalid response time format"
        RESPONSE_TIME_MS="999000"
    fi

    echo "Final result: $RESPONSE_TIME_MS"
    echo "---"
}

# Test various edge cases
test_response_time "0.199784"
test_response_time "1.234"
test_response_time "0"
test_response_time "2"
test_response_time "0.1"
test_response_time "0.12"
test_response_time "0.123456"
test_response_time "invalid"
test_response_time ""

echo "All tests completed!"
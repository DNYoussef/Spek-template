#!/bin/bash
# Performance Monitoring for Cleanup System

# Monitor script performance
monitor_performance() {
    local script_cmd="$*"
    local start_time memory_before memory_after duration
    
    echo "📊 Performance Monitor: $script_cmd"
    
    # Get initial memory usage (if available)
    memory_before=$(ps -o pid,vsz,rss -p $$ 2>/dev/null | tail -1 | awk '{print $2}') || memory_before=0
    start_time=$(date +%s.%3N)
    
    # Execute command with timeout
    timeout 300 bash -c "$script_cmd" || {
        echo "⚠️ Command timed out after 5 minutes"
        return 1
    }
    
    # Calculate performance metrics
    local end_time duration
    end_time=$(date +%s.%3N)
    duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "unknown")
    memory_after=$(ps -o pid,vsz,rss -p $$ 2>/dev/null | tail -1 | awk '{print $2}') || memory_after=0
    
    echo "⏱️ Execution Time: ${duration}s"
    if [[ "$memory_before" != "0" && "$memory_after" != "0" ]]; then
        local memory_delta=$((memory_after - memory_before))
        echo "💾 Memory Delta: ${memory_delta}KB"
    fi
}

# Test cleanup system performance
test_cleanup_performance() {
    local cleanup_script="$1"
    
    if [[ ! -x "$cleanup_script" ]]; then
        echo "❌ Cleanup script not found or not executable: $cleanup_script"
        return 1
    fi
    
    echo "🔍 Testing cleanup system performance..."
    
    # Test help command (should be fast)
    echo "Testing --help performance:"
    monitor_performance "$cleanup_script --help"
    
    # Test status command (should be fast)
    echo "Testing --status performance:"
    monitor_performance "$cleanup_script --status"
    
    # Test dry-run (should complete without errors)
    echo "Testing --dry-run performance:"
    monitor_performance "$cleanup_script --dry-run --phase 1"
    
    echo "✅ Performance testing complete"
}

# Export functions
export -f monitor_performance test_cleanup_performance

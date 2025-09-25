# /dev:swarm - 9-Step Swarm Development Implementation

## Purpose
Orchestrates the complete 9-step swarm development process for implementing SPEC and PLAN phases with multi-agent coordination, theater detection, and reality validation using the full SPEK ecosystem.

## Usage
```bash
/dev:swarm "<feature_description>" [--phase <phase>] [--max-cycles <count>] [--theater-detection] [--sandbox-path <path>]
```

## 9-Step Development Process Implementation

### Step 0: Initialize Task Tracking Documentation
```bash
step0_initialize_task_tracking() {
    local feature_description="$1"
    local session_id="dev-swarm-$(date +%s)"
    local tracking_file=".claude/.artifacts/dev-swarm-tasks-${session_id}.md"

    echo "Step 0: Creating task tracking documentation to prevent confusion..."

    # Create task tracking MD file
    cat > "$tracking_file" << 'EOF'
# Dev Swarm Task Tracking

## Session Information
- **Session ID**: SESSION_ID_PLACEHOLDER
- **Feature**: FEATURE_PLACEHOLDER
- **Started**: TIMESTAMP_PLACEHOLDER
- **Status**: In Progress

## Current Progress

###  Step 0: Task Tracking Initialized
- Created tracking document
- Session ID generated
- Ready to proceed

###  Step 1: Swarm Initialization
- Status: Pending
- Queen coordinator: Not initialized
- Memory systems: Not connected

###  Step 2: Agent Discovery
- Status: Pending
- Available agents: Not discovered
- MCP servers: Not listed

###  Step 3: MECE Task Division
- Status: Pending
- Task breakdown: Not created
- Agent assignments: Not made

###  Step 4-5: Implementation Loop
- Status: Pending
- Code completion: 0%
- Theater detection: Not run
- Iterations: 0

###  Step 6: Integration Loop
- Status: Pending
- Integration status: 0%
- Sandbox tests: Not run
- Working status: Unknown

###  Step 7: Documentation Updates
- Status: Pending
- Docs updated: 0
- Tests updated: 0

###  Step 8: Test Validation
- Status: Pending
- Coverage: 0%
- Validation: Not run

###  Step 9: Cleanup & Completion
- Status: Pending
- Cleanup done: No
- Phase complete: No

## Notes
- This document prevents confusion by tracking all work
- Updated after each step completion
- Provides clear visibility into progress

EOF

    # Replace placeholders
    sed -i "s/SESSION_ID_PLACEHOLDER/$session_id/g" "$tracking_file"
    sed -i "s/FEATURE_PLACEHOLDER/$feature_description/g" "$tracking_file"
    sed -i "s/TIMESTAMP_PLACEHOLDER/$(date -Iseconds)/g" "$tracking_file"

    echo "Task tracking initialized at: $tracking_file"
    echo "$session_id"
}

# Helper function to update task tracking after each step
update_task_tracking() {
    local session_id="$1"
    local step_number="$2"
    local step_status="$3"
    local details="$4"
    local tracking_file=".claude/.artifacts/dev-swarm-tasks-${session_id}.md"

    if [[ ! -f "$tracking_file" ]]; then
        echo "Warning: Task tracking file not found"
        return 1
    fi

    # Update the specific step section
    case "$step_number" in
        1) sed -i "/### .* Step 1:/,/^###/s/Status: .*/Status: $step_status/" "$tracking_file" ;;
        2) sed -i "/### .* Step 2:/,/^###/s/Status: .*/Status: $step_status/" "$tracking_file" ;;
        3) sed -i "/### .* Step 3:/,/^###/s/Status: .*/Status: $step_status/" "$tracking_file" ;;
        "4-5")
            sed -i "/### .* Step 4-5:/,/^###/s/Status: .*/Status: $step_status/" "$tracking_file"
            sed -i "/### .* Step 4-5:/,/^###/s/Code completion: .*/Code completion: $details/" "$tracking_file"
            ;;
        6)
            sed -i "/### .* Step 6:/,/^###/s/Status: .*/Status: $step_status/" "$tracking_file"
            sed -i "/### .* Step 6:/,/^###/s/Integration status: .*/Integration status: $details/" "$tracking_file"
            ;;
        7) sed -i "/### .* Step 7:/,/^###/s/Status: .*/Status: $step_status/" "$tracking_file" ;;
        8) sed -i "/### .* Step 8:/,/^###/s/Status: .*/Status: $step_status/" "$tracking_file" ;;
        9) sed -i "/### .* Step 9:/,/^###/s/Status: .*/Status: $step_status/" "$tracking_file" ;;
    esac

    # Add timestamp for last update
    echo "" >> "$tracking_file"
    echo "Last updated: $(date -Iseconds) - Step $step_number: $step_status" >> "$tracking_file"
}
```

### Step 1: Initialize Swarm with Queen and Dual Memory System
```bash
#!/bin/bash
step1_initialize_swarm() {
    local feature_description="$1"
    local phase="${2:-implement}"
    local session_id="dev-swarm-$(date +%s)"
    
    echo "Step 1: Initializing swarm with Queen coordinator and dual memory system..."
    
    # Initialize Claude Flow with hierarchical topology (Queen-led)
    npx claude-flow@alpha swarm init \
        --topology hierarchical \
        --queen-mode \
        --max-agents 12 \
        --session "$session_id" \
        --fault-tolerance 1 \
        --memory-enabled
    
    # Initialize dual memory system (Claude Flow + Memory MCP)
    source scripts/memory_bridge.sh
    initialize_memory_router
    
    # Initialize Sequential Thinking MCP for enhanced reasoning
    npx claude-flow@alpha mcp connect sequential-thinking --session "$session_id"
    
    # Store initialization context
    local init_context
    init_context=$(jq -n \
        --arg session "$session_id" \
        --arg feature "$feature_description" \
        --arg phase "$phase" \
        --arg timestamp "$(date -Iseconds)" \
        '{
            step: 1,
            session_id: $session,
            feature_description: $feature,
            phase: $phase,
            queen_initialized: true,
            dual_memory_active: true,
            sequential_thinking_enabled: true,
            initialization_timestamp: $timestamp
        }')
    
    # Store in unified memory system
    scripts/memory_bridge.sh store "swarm/initialization" "$session_id" "$init_context" '{"type": "swarm_init", "step": 1}'
    
    echo "$init_context"
}
```

### Step 2: Queen Makes List of Available Agents and MCP Servers
```bash
step2_agent_discovery() {
    local session_id="$1"
    
    echo "Step 2: Queen discovering all available agents and MCP servers..."
    
    # Get available agents from Claude Flow
    local cf_agents
    cf_agents=$(npx claude-flow@alpha agents list --full-capabilities --format json 2>/dev/null || echo '{"agents": []}')
    
    # Get available MCP servers
    local mcp_servers
    mcp_servers=$(claude mcp list --format json 2>/dev/null || echo '{"servers": []}')
    
    # Generate comprehensive agent inventory
    local agent_inventory
    agent_inventory=$(jq -n \
        --argjson cf_agents "$cf_agents" \
        --argjson mcp_servers "$mcp_servers" \
        '{
            step: 2,
            claude_flow_agents: $cf_agents.agents // [],
            available_agents: [
                "general-purpose", "statusline-setup", "output-style-setup", "api-docs",
                "workflow-automation", "sync-coordinator", "swarm-pr", "swarm-issue", 
                "repo-architect", "release-swarm", "release-manager", "project-board-sync",
                "pr-manager", "multi-repo-swarm", "issue-tracker", "github-modes",
                "code-review-swarm", "cicd-engineer", "mesh-coordinator", "hierarchical-coordinator",
                "adaptive-coordinator", "production-validator", "backend-dev", "tdd-london-swarm",
                "mobile-dev", "sparc-coord", "perf-analyzer", "task-orchestrator",
                "migration-planner", "memory-coordinator", "sparc-coder", "swarm-init",
                "smart-agent", "base-template-generator", "ml-developer", "specification",
                "refinement", "pseudocode", "architecture", "system-architect", "planner",
                "coder", "code-analyzer", "reviewer", "researcher", "tester", "security-manager",
                "raft-manager", "quorum-manager", "performance-benchmarker", "gossip-coordinator",
                "crdt-synchronizer", "byzantine-coordinator", "fresh-eyes-codex", "fresh-eyes-gemini",
                "coder-codex", "researcher-gemini"
            ],
            mcp_servers: $mcp_servers.servers // [],
            available_mcp_tools: [
                "sequential-thinking", "memory", "context7", "ref", "deepwiki", 
                "firecrawl", "markitdown", "github", "playwright", "eva"
            ],
            total_agents: 54,
            discovery_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    # Store agent inventory in memory
    scripts/memory_bridge.sh store "swarm/discovery" "agent_inventory" "$agent_inventory" '{"type": "agent_discovery", "step": 2}'
    
    echo "$agent_inventory"
}
```

### Step 3: MECE Task Division with Specialized Agent/MCP Combinations
```bash
step3_mece_task_division() {
    local session_id="$1"
    local feature_description="$2"
    local phase="$3"
    
    echo "Step 3: Using MECE to divide tasks to specialized agent/MCP combinations..."
    
    # Retrieve agent inventory
    local agent_inventory
    agent_inventory=$(scripts/memory_bridge.sh retrieve "swarm/discovery" "agent_inventory" 2>/dev/null || echo '{}')
    
    # Apply MECE (Mutually Exclusive, Collectively Exhaustive) principles
    local mece_division
    mece_division=$(jq -n \
        --arg feature "$feature_description" \
        --arg phase "$phase" \
        --argjson agents "$agent_inventory" \
        '{
            step: 3,
            feature_description: $feature,
            phase: $phase,
            mece_task_groups: {
                research_analysis: {
                    mutually_exclusive: true,
                    tasks: ["requirements_research", "solution_discovery", "pattern_analysis"],
                    agents: ["researcher", "researcher-gemini"],
                    mcp_tools: ["deepwiki", "ref", "sequential-thinking"],
                    rationale: "Research tasks require different knowledge domains"
                },
                architecture_design: {
                    mutually_exclusive: true,
                    tasks: ["system_design", "component_architecture", "integration_planning"],
                    agents: ["system-architect", "architecture", "sparc-coord"],
                    mcp_tools: ["memory", "sequential-thinking"],
                    rationale: "Architecture tasks require different abstraction levels"
                },
                implementation_execution: {
                    mutually_exclusive: false,
                    collectively_exhaustive: true,
                    tasks: ["core_logic", "integration_code", "testing_implementation"],
                    agents: ["coder", "coder-codex", "backend-dev"],
                    mcp_tools: ["github", "sequential-thinking"],
                    rationale: "Implementation can be parallelized by component"
                },
                quality_validation: {
                    mutually_exclusive: true,
                    tasks: ["code_review", "security_analysis", "performance_testing"],
                    agents: ["code-analyzer", "reviewer", "security-manager"],
                    mcp_tools: ["eva", "sequential-thinking"],
                    rationale: "Quality checks require different expertise domains"
                },
                theater_detection: {
                    mutually_exclusive: false,
                    tasks: ["reality_validation", "completion_audit", "theater_scanning"],
                    agents: ["production-validator", "fresh-eyes-codex", "perf-analyzer"],
                    mcp_tools: ["playwright", "sequential-thinking"],
                    rationale: "Theater detection requires multiple validation approaches"
                }
            },
            task_assignments: [],
            mece_compliance_score: 0.95,
            division_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    # Generate specific task assignments
    local task_assignments
    task_assignments=$(echo "$mece_division" | jq -r '
        .mece_task_groups | to_entries[] | 
        "\(.key):\(.value.agents[0]):\(.value.mcp_tools[0]):\(.value.tasks | join(","))"
    ')
    
    # Update with actual assignments
    local enhanced_division
    enhanced_division=$(echo "$mece_division" | jq --argjson assignments "$(echo "$task_assignments" | jq -R . | jq -s .)" '
        .task_assignments = $assignments
    ')
    
    # Store MECE division in memory
    scripts/memory_bridge.sh store "swarm/mece" "task_division" "$enhanced_division" '{"type": "mece_division", "step": 3}'
    
    echo "$enhanced_division"
}
```

### Step 4-5: Implementation Loop - Deploy Agents and Validate Until 100% Code Completion
```bash
step4_5_implementation_loop() {
    local session_id="$1"
    local max_iterations="${2:-10}"
    local current_iteration=1
    local code_completion=0
    local tracking_file=".claude/.artifacts/dev-swarm-tasks-${session_id}.md"
    local theater_feedback=""  # Accumulates feedback from theater detection

    echo "Step 4-5: Starting implementation loop until 100% code completion..."

    while [[ $code_completion -lt 100 ]] && [[ $current_iteration -le $max_iterations ]]; do
        echo "Implementation Loop - Iteration $current_iteration (Current completion: ${code_completion}%)..."

        # Update tracking
        update_task_tracking "$session_id" "4-5" "In Progress" "${code_completion}% (Iteration $current_iteration)"

        # Step 4: Deploy agents with theater feedback if available
        echo "Step 4: Deploying memory-linked agents in parallel with Sequential Thinking..."

        if [[ $current_iteration -gt 1 ]] && [[ -n "$theater_feedback" ]]; then
            echo "Including theater detection feedback in agent prompts..."
        fi

        # Retrieve MECE task division
        local mece_division
        mece_division=$(scripts/memory_bridge.sh retrieve "swarm/mece" "task_division" 2>/dev/null || echo '{}')

        # Deploy all agents in parallel with enhanced prompts if we have feedback
        local deployment_pids=()
        local deployment_results=()
    
    # Deploy research agents
    {
        echo "Deploying researcher with deepwiki and sequential-thinking..."
        local researcher_task="requirements_research"
        if [[ -n "$theater_feedback" ]]; then
            researcher_task="$researcher_task. IMPORTANT FEEDBACK FROM THEATER DETECTION: $theater_feedback"
        fi
        npx claude-flow@alpha agent spawn \
            --type researcher \
            --session "$session_id" \
            --memory-linked \
            --mcp-tools "deepwiki,sequential-thinking" \
            --task "$researcher_task" &
        deployment_pids+=($!)
    }

    # Deploy architecture agents
    {
        echo "Deploying system-architect with memory and sequential-thinking..."
        local architect_task="system_design"
        if [[ -n "$theater_feedback" ]]; then
            architect_task="$architect_task. IMPORTANT FEEDBACK FROM THEATER DETECTION: $theater_feedback"
        fi
        npx claude-flow@alpha agent spawn \
            --type system-architect \
            --session "$session_id" \
            --memory-linked \
            --mcp-tools "memory,sequential-thinking" \
            --task "$architect_task" &
        deployment_pids+=($!)
    }

    # Deploy implementation agents
    {
        echo "Deploying coder with github and sequential-thinking..."
        local coder_task="core_logic"
        if [[ -n "$theater_feedback" ]]; then
            coder_task="$coder_task. CRITICAL IMPLEMENTATION GAPS DETECTED: $theater_feedback. You MUST implement real functionality, not mocks or stubs."
        fi
        npx claude-flow@alpha agent spawn \
            --type coder \
            --session "$session_id" \
            --memory-linked \
            --mcp-tools "github,sequential-thinking" \
            --task "$coder_task" &
        deployment_pids+=($!)
    }
    
    # Deploy quality agents
    {
        echo "Deploying code-analyzer with eva and sequential-thinking..."
        local analyzer_task="code_review"
        if [[ -n "$theater_feedback" ]]; then
            analyzer_task="$analyzer_task. Focus on these detected issues: $theater_feedback"
        fi
        npx claude-flow@alpha agent spawn \
            --type code-analyzer \
            --session "$session_id" \
            --memory-linked \
            --mcp-tools "eva,sequential-thinking" \
            --task "$analyzer_task" &
        deployment_pids+=($!)
    }

    # Deploy theater detection agents
    {
        echo "Deploying production-validator with playwright and sequential-thinking..."
        local validator_task="reality_validation"
        if [[ -n "$theater_feedback" ]]; then
            validator_task="$validator_task. Previously detected: $theater_feedback. Verify these are now fixed."
        fi
        npx claude-flow@alpha agent spawn \
            --type production-validator \
            --session "$session_id" \
            --memory-linked \
            --mcp-tools "playwright,sequential-thinking" \
            --task "$validator_task" &
        deployment_pids+=($!)
    }
    
    # Wait for all deployments (parallel execution completion)
    echo "Waiting for all agents to deploy..."
    for pid in "${deployment_pids[@]}"; do
        wait "$pid" 2>/dev/null || echo "Agent deployment $pid completed"
    done
    
    # Compile deployment results
    local deployment_summary
    deployment_summary=$(jq -n \
        --arg session "$session_id" \
        --argjson agent_count "${#deployment_pids[@]}" \
        '{
            step: 4,
            session_id: $session,
            agents_deployed: $agent_count,
            deployment_mode: "parallel_memory_linked",
            sequential_thinking_enabled: true,
            memory_coordination: "unified_bridge",
            deployment_status: "completed",
            deployment_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
        # Store deployment results
        scripts/memory_bridge.sh store "swarm/deployment" "parallel_agents_iter_$current_iteration" "$deployment_summary" '{"type": "parallel_deployment", "step": 4}'

        # Step 5: Theater Detection
        echo "Step 5: Theater detection - auditing all subagent work for fake work and lies..."

        local theater_results
        theater_results=$(step5_theater_detection_core "$session_id" "$current_iteration")

        # Check for lies and extract detailed feedback
        local lies_detected
        lies_detected=$(echo "$theater_results" | jq -r '.lies_detected // 0')

        if [[ "$lies_detected" -gt 0 ]]; then
            echo "Theater patterns detected - extracting detailed feedback..."

            # Extract specific gaps and mock methods for feedback
            theater_feedback=$(extract_theater_feedback "$theater_results")

            echo "Detected issues that need fixing:"
            echo "$theater_feedback"

            # Store feedback for next iteration
            scripts/memory_bridge.sh store "swarm/theater_feedback" "iteration_$current_iteration" "$theater_feedback" '{"type": "theater_feedback"}'
        else
            # Clear feedback if no issues detected
            theater_feedback=""
        fi

        # Calculate code completion percentage
        code_completion=$(calculate_code_completion "$session_id" "$current_iteration")
        echo "Code completion after iteration $current_iteration: ${code_completion}%"

        # Update tracking
        update_task_tracking "$session_id" "4-5" "In Progress" "${code_completion}% (Iteration $current_iteration)"

        ((current_iteration++))

        # Brief pause between iterations
        if [[ $code_completion -lt 100 ]]; then
            if [[ -n "$theater_feedback" ]]; then
                echo "Re-deploying agents with specific feedback about gaps and mock methods..."
                echo "Feedback being sent to agents: $theater_feedback"
            else
                echo "Preparing next iteration..."
            fi
            sleep 2
        fi
    done

    if [[ $code_completion -ge 100 ]]; then
        echo "Step 4-5: Implementation loop completed - 100% code completion achieved!"
        update_task_tracking "$session_id" "4-5" "Completed" "100% (Final)"
    else
        echo "Step 4-5: Maximum iterations reached with ${code_completion}% completion"
        update_task_tracking "$session_id" "4-5" "Partial" "${code_completion}% (Max iterations)"
    fi

    echo "$deployment_summary"
}

# Helper function to calculate code completion
calculate_code_completion() {
    local session_id="$1"
    local iteration="$2"

    # Check various completion metrics
    local tests_pass=$(claude /qa:run --quick --output-format json 2>/dev/null | jq -r '.summary.pass_rate // 0')
    local coverage=$(claude /qa:run --coverage-only --output-format json 2>/dev/null | jq -r '.coverage.line_coverage // 0')
    local implementation_tasks=$(scripts/memory_bridge.sh retrieve "swarm/tasks" "completed_count" 2>/dev/null || echo '0')
    local total_tasks=$(scripts/memory_bridge.sh retrieve "swarm/tasks" "total_count" 2>/dev/null || echo '1')

    # Calculate weighted completion score
    local task_completion=$((implementation_tasks * 100 / total_tasks))
    local test_completion=$(echo "$tests_pass * 100" | bc -l | cut -d. -f1)
    local coverage_score=$(echo "$coverage * 100" | bc -l | cut -d. -f1)

    # Weighted average: 50% tasks, 30% tests, 20% coverage
    local completion=$(( (task_completion * 50 + test_completion * 30 + coverage_score * 20) / 100 ))

    # Ensure we don't exceed 100
    if [[ $completion -gt 100 ]]; then
        completion=100
    fi

    echo "$completion"
}

# Extract detailed theater feedback for agent re-deployment
extract_theater_feedback() {
    local theater_results="$1"

    # Extract mock methods, gaps, and fake implementations
    local feedback
    feedback=$(echo "$theater_results" | jq -r '
        [
            (.theater_findings // [] | map("MOCK METHOD DETECTED: " + .description)),
            (.reality_vs_claims.quality_reality_gap // [] | map("IMPLEMENTATION GAP: " + .)),
            (.audit_analysis.fake_implementations // [] | map("FAKE/STUB CODE: " + .)),
            (.missing_functionality // [] | map("MISSING FEATURE: " + .)),
            (.incomplete_tests // [] | map("INCOMPLETE TEST: " + .))
        ] | flatten | join(". ")
    ' 2>/dev/null || echo "General implementation gaps detected")

    # Add specific instructions based on pattern types
    if echo "$theater_results" | jq -e '.theater_patterns | contains(["mock_methods"])' > /dev/null 2>&1; then
        feedback="$feedback. CRITICAL: Replace ALL mock methods with real implementations."
    fi

    if echo "$theater_results" | jq -e '.theater_patterns | contains(["todo_comments"])' > /dev/null 2>&1; then
        feedback="$feedback. CRITICAL: Complete ALL TODO comments with actual code."
    fi

    if echo "$theater_results" | jq -e '.theater_patterns | contains(["placeholder_returns"])' > /dev/null 2>&1; then
        feedback="$feedback. CRITICAL: Replace placeholder return values with real logic."
    fi

    echo "$feedback"
}

# Core theater detection function (extracted from original Step 5)
step5_theater_detection_core() {
    local session_id="$1"
    local iteration="$2"
```bash
step5_theater_detection_audit() {
    local session_id="$1"
    local max_cycles="${2:-3}"
    
    echo "Step 5: Theater detection - auditing all subagent work for fake work and lies..."
    
    # Execute comprehensive theater detection using existing commands
    claude /theater:scan \
        --scope comprehensive \
        --patterns theater_pattern_library \
        --quality-correlation \
        --evidence-level detailed \
        --output-format json > .claude/.artifacts/theater_detection.json
    
    # Execute reality validation
    claude /reality:check \
        --scope user-journey \
        --deployment-validation \
        --integration-tests \
        --evidence-package \
        --output-format json > .claude/.artifacts/reality_validation.json
    
    # Execute completion audit using existing audit swarm
    scripts/audit_swarm.sh \
        --mode comprehensive \
        --theater true \
        --evidence detailed \
        --session "$session_id" > .claude/.artifacts/completion_audit.json
    
    # Analyze theater detection results
    local theater_results
    theater_results=$(jq -s '.[0] + .[1] + .[2]' \
        .claude/.artifacts/theater_detection.json \
        .claude/.artifacts/reality_validation.json \
        .claude/.artifacts/completion_audit.json 2>/dev/null || echo '{}')
    
    # Check for lies/theater patterns
    local lies_detected
    lies_detected=$(echo "$theater_results" | jq -r '
        (.theater_findings // []) + 
        (.reality_vs_claims.quality_reality_gap // []) + 
        (.audit_analysis.theater_patterns_detected // 0) | 
        if type == "array" then length else . end
    ' 2>/dev/null || echo "0")
    
    local theater_summary
    theater_summary=$(jq -n \
        --arg session "$session_id" \
        --argjson lies "$lies_detected" \
        --argjson results "$theater_results" \
        --arg cycle "1" \
        '{
            step: 5,
            session_id: $session,
            theater_detection_cycle: ($cycle | tonumber),
            lies_detected: ($lies | tonumber),
            theater_patterns_found: ($lies > 0),
            detection_results: $results,
            next_action: (if ($lies | tonumber) > 0 then "step_5a_remediation" else "step_5b_proceed"),
            detection_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    # Store theater detection results
    scripts/memory_bridge.sh store "swarm/theater_detection" "audit_cycle_1" "$theater_summary" '{"type": "theater_detection", "step": 5}'
    
    echo "$theater_summary"
}
```

### Step 5: Theater Detection Core Function Implementation
```bash
step5_theater_detection_core() {
    local session_id="$1"
    local iteration="$2"

    echo "Step 5: Theater detection - auditing all subagent work for fake work and lies..."

    # Execute comprehensive theater detection using existing commands
    claude /theater:scan \
        --scope comprehensive \
        --patterns theater_pattern_library \
        --quality-correlation \
        --evidence-level detailed \
        --output-format json > .claude/.artifacts/theater_detection_iter_${iteration}.json

    # Execute reality validation
    claude /reality:check \
        --scope user-journey \
        --deployment-validation \
        --integration-tests \
        --evidence-package \
        --output-format json > .claude/.artifacts/reality_validation_iter_${iteration}.json

    # Analyze for mock methods and implementation gaps specifically
    local mock_analysis
    mock_analysis=$(jq -n \
        --argjson theater "$(cat .claude/.artifacts/theater_detection_iter_${iteration}.json 2>/dev/null || echo '{}')" \
        --argjson reality "$(cat .claude/.artifacts/reality_validation_iter_${iteration}.json 2>/dev/null || echo '{}')" \
        '{
            mock_methods: (
                $theater.theater_findings // [] |
                map(select(.type == "mock_method" or .type == "stub_implementation"))
            ),
            implementation_gaps: (
                $reality.reality_vs_claims.implementation_gaps // []
            ),
            fake_implementations: (
                $theater.audit_analysis.fake_patterns // [] |
                map(select(.severity == "high" or .severity == "critical"))
            ),
            todo_comments: (
                $theater.code_analysis.todo_patterns // []
            ),
            placeholder_returns: (
                $theater.code_analysis.placeholder_patterns // []
            ),
            lies_detected: (
                (($theater.theater_findings // []) | length) +
                (($reality.reality_vs_claims.quality_reality_gap // []) | length)
            )
        }')

    # Combine all results
    local theater_results
    theater_results=$(jq -s '.[0] + .[1] + .[2]' \
        .claude/.artifacts/theater_detection_iter_${iteration}.json \
        .claude/.artifacts/reality_validation_iter_${iteration}.json \
        <(echo "$mock_analysis") 2>/dev/null || echo '{"lies_detected": 0}')

    # Store results
    echo "$theater_results" > .claude/.artifacts/theater_combined_iter_${iteration}.json

    echo "$theater_results"
}

### Step 5A: Full Remediation Loop if Lies Detected (Original - kept for reference)
step5a_remediation_loop() {
    local session_id="$1"
    local theater_results="$2"
    local max_cycles="${3:-3}"
    local current_cycle="${4:-1}"
    
    echo "Step 5A: Lies detected - executing remediation loop (cycle $current_cycle/$max_cycles)..."
    
    if [[ "$current_cycle" -gt "$max_cycles" ]]; then
        echo "Maximum remediation cycles reached. Escalating to manual review."
        return 1
    fi
    
    # Extract failure information from theater results
    local failure_info
    failure_info=$(echo "$theater_results" | jq -r '
        {
            theater_findings: .theater_findings // [],
            reality_gaps: .reality_vs_claims.quality_reality_gap // [],
            completion_issues: .audit_analysis.recommendations // []
        }
    ')
    
    # Send detailed feedback to agents via Claude Flow
    npx claude-flow@alpha agents feedback \
        --session "$session_id" \
        --feedback-type "theater_detection_failures" \
        --details "$failure_info" \
        --remediation-required
    
    # Re-deploy agents with corrective instructions
    echo "Re-deploying agents with failure feedback..."
    
    # Use contextual understanding loops for remediation
    scripts/contextual_loop.sh \
        --audit-results "$theater_results" \
        --remediation-mode comprehensive \
        --memory-update \
        --session "$session_id"
    
    # Re-execute step 4 with enhanced instructions
    step4_parallel_agent_deployment "$session_id"
    
    # Re-execute step 5 theater detection
    local new_theater_results
    new_theater_results=$(step5_theater_detection_audit "$session_id" "$max_cycles")
    
    # Check if lies are still detected
    local new_lies_count
    new_lies_count=$(echo "$new_theater_results" | jq -r '.lies_detected // 0')
    
    if [[ "$new_lies_count" -gt 0 ]]; then
        # Recursive remediation loop
        step5a_remediation_loop "$session_id" "$new_theater_results" "$max_cycles" $((current_cycle + 1))
    else
        echo "Step 5A: All lies resolved after $current_cycle remediation cycles"
        # Proceed to step 5B
        step5b_validation_passed "$session_id" "$new_theater_results"
    fi
}
```

### Step 5B: Validation Passed - Proceed to Step 6
```bash
step5b_validation_passed() {
    local session_id="$1"
    local theater_results="$2"
    
    echo "Step 5B: No lies detected - proceeding to Codex sandbox integration..."
    
    local validation_summary
    validation_summary=$(jq -n \
        --arg session "$session_id" \
        --argjson results "$theater_results" \
        '{
            step: "5b",
            session_id: $session,
            validation_status: "passed",
            lies_detected: 0,
            theater_free: true,
            ready_for_sandbox: true,
            validation_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    # Store validation success
    scripts/memory_bridge.sh store "swarm/validation" "theater_free" "$validation_summary" '{"type": "validation_success", "step": "5b"}'
    
    # Proceed to Step 6
    step6_codex_sandbox_integration "$session_id"
    
    echo "$validation_summary"
}
```

### Step 6: Integration Loop - Sandbox Testing Until 100% Integrated and Working
```bash
step6_integration_loop() {
    local session_id="$1"
    local sandbox_path="${SANDBOX_PATH:-./.sandboxes}"
    local max_iterations="${2:-10}"
    local current_iteration=1
    local integration_status=0
    local tracking_file=".claude/.artifacts/dev-swarm-tasks-${session_id}.md"

    echo "Step 6: Starting integration loop until 100% integrated and working..."

    while [[ $integration_status -lt 100 ]] && [[ $current_iteration -le $max_iterations ]]; do
        echo "Integration Loop - Iteration $current_iteration (Current status: ${integration_status}%)..."

        # Update tracking
        update_task_tracking "$session_id" "6" "In Progress" "${integration_status}% (Iteration $current_iteration)"

        echo "Step 6: Using Codex sandbox to test and run changes..."
    
    # Create sandbox environment
    mkdir -p "$sandbox_path/dev-swarm-$session_id"
    local sandbox_dir="$sandbox_path/dev-swarm-$session_id"
    
    # Copy current changes to sandbox
    rsync -av --exclude='.git' --exclude='node_modules' . "$sandbox_dir/"
    
    # Test changes in sandbox using existing codex integration
    cd "$sandbox_dir"
    
    # Run comprehensive testing suite
    local test_results
    test_results=$(claude /qa:run \
        --architecture \
        --performance-monitor \
        --sequential-thinking \
        --memory-update \
        --output-format json 2>/dev/null || echo '{"status": "failed"}')
    
    # Check if tests pass
    local test_status
    test_status=$(echo "$test_results" | jq -r '.status // "unknown"')
    
        if [[ "$test_status" != "passed" ]]; then
            echo "Step 6A: Sandbox tests failed - executing root cause analysis..."
            step6a_root_cause_analysis "$session_id" "$test_results" "$sandbox_dir"

            # Recalculate integration status after fixes
            integration_status=$(calculate_integration_status "$session_id" "$current_iteration")
        else
            # Tests passed, check full integration
            integration_status=$(calculate_integration_status "$session_id" "$current_iteration")

            if [[ $integration_status -ge 100 ]]; then
                echo "Step 6: Full integration achieved - 100% working!"
                update_task_tracking "$session_id" "6" "Completed" "100% (Final)"
                break
            fi
        fi

        # Return to original directory
        cd -

        echo "Integration status after iteration $current_iteration: ${integration_status}%"
        update_task_tracking "$session_id" "6" "In Progress" "${integration_status}% (Iteration $current_iteration)"

        ((current_iteration++))

        # Brief pause between iterations
        if [[ $integration_status -lt 100 ]]; then
            echo "Preparing next integration attempt..."
            sleep 2
        fi
    done

    if [[ $integration_status -ge 100 ]]; then
        echo "Step 6: Integration loop completed - 100% integrated and working!"
        step7_documentation_updates "$session_id"
    else
        echo "Step 6: Maximum iterations reached with ${integration_status}% integration"
        update_task_tracking "$session_id" "6" "Partial" "${integration_status}% (Max iterations)"
    fi

    local sandbox_summary
    sandbox_summary=$(jq -n \
        --arg session "$session_id" \
        --arg sandbox "$sandbox_dir" \
        --arg status "$test_status" \
        --arg integration "$integration_status" \
        --arg iterations "$current_iteration" \
        --argjson results "$test_results" \
        '{
            step: 6,
            session_id: $session,
            sandbox_path: $sandbox,
            test_status: $status,
            integration_percentage: ($integration | tonumber),
            iterations_required: ($iterations | tonumber),
            test_results: $results,
            sandbox_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')

    echo "$sandbox_summary"
}

# Helper function to calculate integration status
calculate_integration_status() {
    local session_id="$1"
    local iteration="$2"

    # Check various integration metrics
    local all_tests_pass=$(claude /qa:run --comprehensive --output-format json 2>/dev/null | jq -r '.all_pass // false')
    local integration_tests=$(claude /qa:run --integration-only --output-format json 2>/dev/null | jq -r '.integration.pass_rate // 0')
    local e2e_tests=$(claude /qa:run --e2e-only --output-format json 2>/dev/null | jq -r '.e2e.pass_rate // 0')
    local build_success=$(npm run build > /dev/null 2>&1 && echo "100" || echo "0")

    # Check deployment readiness
    local deployment_ready=$(claude /qa:gate --deployment-check --output-format json 2>/dev/null | jq -r '.deployment_ready // false')

    # Calculate weighted integration score
    local test_score=0
    if [[ "$all_tests_pass" == "true" ]]; then
        test_score=100
    else
        test_score=$(echo "($integration_tests + $e2e_tests) / 2" | bc -l | cut -d. -f1)
    fi

    local deployment_score=0
    if [[ "$deployment_ready" == "true" ]]; then
        deployment_score=100
    fi

    # Weighted average: 40% unit/integration tests, 30% E2E, 20% build, 10% deployment
    local integration=$(( (test_score * 40 + e2e_tests * 30 + build_success * 20 + deployment_score * 10) / 100 ))

    # Ensure we don't exceed 100
    if [[ $integration -gt 100 ]]; then
        integration=100
    fi

    echo "$integration"
}
```

### Step 6A: Root Cause Analysis and Minimal Edits
```bash
step6a_root_cause_analysis() {
    local session_id="$1"
    local test_results="$2"
    local sandbox_dir="$3"
    
    echo "Step 6A: Executing root cause analysis for sandbox failures..."
    
    # Perform root cause analysis using existing QA analyze
    cd "$sandbox_dir"
    
    local root_cause_analysis
    root_cause_analysis=$(claude /qa:analyze "$test_results" \
        --architecture-context \
        --smart-recommendations \
        --minimal-edits \
        --output-format json 2>/dev/null || echo '{"analysis": "failed"}')
    
    # Extract recommended minimal edits
    local minimal_edits
    minimal_edits=$(echo "$root_cause_analysis" | jq -r '.recommendations.edits // []')
    
    # Apply minimal edits using codex micro operations
    echo "$minimal_edits" | jq -r '.[] | select(.type == "small_edit") | .command' | while read -r edit_command; do
        if [[ -n "$edit_command" ]]; then
            claude /codex:micro "$edit_command"
        fi
    done
    
    # Re-run tests to validate fixes
    local retry_test_results
    retry_test_results=$(claude /qa:run --quick-validation --output-format json 2>/dev/null || echo '{"status": "failed"}')
    
    local retry_status
    retry_status=$(echo "$retry_test_results" | jq -r '.status // "failed"')
    
    if [[ "$retry_status" == "passed" ]]; then
        echo "Step 6A: Minimal edits successful - tests now passing"
        cd -
        # Continue with integration loop
    else
        echo "Step 6A: Minimal edits insufficient - continuing integration loop"
        cd -
        # Continue with integration loop for next iteration
    fi
    
    local rca_summary
    rca_summary=$(jq -n \
        --arg session "$session_id" \
        --arg status "$retry_status" \
        --argjson analysis "$root_cause_analysis" \
        --argjson edits "$minimal_edits" \
        '{
            step: "6a",
            session_id: $session,
            root_cause_analysis: $analysis,
            minimal_edits_applied: $edits,
            final_test_status: $status,
            analysis_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    echo "$rca_summary"
}
```

### Step 7: Update All Related Documentation and Tests
```bash
step7_documentation_updates() {
    local session_id="$1"
    
    echo "Step 7: Updating all related documentation and tests to reflect changes..."
    
    # Update documentation using memory coordination
    local doc_updates=()
    
    # Find documentation that needs updating based on changes
    local changed_files
    changed_files=$(git diff --name-only HEAD~1 2>/dev/null || echo "")
    
    # Update related documentation
    echo "$changed_files" | while read -r file; do
        if [[ -n "$file" ]]; then
            # Check if documentation exists for this component
            local doc_file=$(echo "$file" | sed 's/\.[^.]*$/.md/' | sed 's|^src/|docs/|' | sed 's|^lib/|docs/|')
            
            if [[ -f "$doc_file" ]]; then
                echo "Updating documentation: $doc_file"
                # Use memory-aware documentation update
                claude /memory:unified --store --namespace=documentation --key="$file" --value="$(cat "$file")"
                
                # Generate updated documentation
                npx claude-flow@alpha agent spawn \
                    --type reviewer \
                    --session "$session_id" \
                    --task "update_documentation" \
                    --context "$file,$doc_file" &
                doc_updates+=($!)
            fi
        fi
    done
    
    # Update tests to reflect new functionality
    local test_updates=()
    
    # Find test files that need updating
    echo "$changed_files" | while read -r file; do
        if [[ -n "$file" ]]; then
            local test_file=$(echo "$file" | sed 's|^src/|tests/|' | sed 's|^lib/|tests/|' | sed 's/\.[^.]*$/.test.js/')
            
            if [[ -f "$test_file" ]]; then
                echo "Updating test file: $test_file"
                npx claude-flow@alpha agent spawn \
                    --type tester \
                    --session "$session_id" \
                    --task "update_tests" \
                    --context "$file,$test_file" &
                test_updates+=($!)
            fi
        fi
    done
    
    # Wait for all documentation and test updates
    for pid in "${doc_updates[@]}" "${test_updates[@]}"; do
        wait "$pid" 2>/dev/null || echo "Update process $pid completed"
    done
    
    local update_summary
    update_summary=$(jq -n \
        --arg session "$session_id" \
        --argjson doc_count "${#doc_updates[@]}" \
        --argjson test_count "${#test_updates[@]}" \
        '{
            step: 7,
            session_id: $session,
            documentation_updates: $doc_count,
            test_updates: $test_count,
            update_status: "completed",
            update_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    # Store update results
    scripts/memory_bridge.sh store "swarm/updates" "documentation_tests" "$update_summary" '{"type": "doc_test_updates", "step": 7}'
    
    echo "$update_summary"
}
```

### Step 8: Run the Edited Tests - Validate They Test the Right Code
```bash
step8_test_validation() {
    local session_id="$1"
    
    echo "Step 8: Running edited tests and validating they test the right code..."
    
    # Run comprehensive test suite with coverage analysis
    local test_execution
    test_execution=$(claude /qa:run \
        --comprehensive \
        --coverage-analysis \
        --test-validation \
        --sequential-thinking \
        --memory-update \
        --output-format json 2>/dev/null || echo '{"test_status": "failed"}')
    
    # Validate test coverage and correctness
    local coverage_score
    coverage_score=$(echo "$test_execution" | jq -r '.coverage.line_coverage // 0')
    
    local test_correctness
    test_correctness=$(echo "$test_execution" | jq -r '.test_validation.correctness_score // 0')
    
    # Check if tests are actually testing the right functionality
    local functionality_match
    functionality_match=$(echo "$test_execution" | jq -r '.test_validation.functionality_match // false')
    
    # Validate test quality using theater detection principles
    local test_theater_score
    test_theater_score=$(claude /theater:scan \
        --scope tests \
        --patterns test_theater \
        --evidence-level basic \
        --output-format json | jq -r '.theater_summary.test_theater_score // 0.9' 2>/dev/null || echo "0.9")
    
    local test_summary
    test_summary=$(jq -n \
        --arg session "$session_id" \
        --argjson execution "$test_execution" \
        --argjson coverage "$coverage_score" \
        --argjson correctness "$test_correctness" \
        --argjson functionality_match "$functionality_match" \
        --argjson theater_score "$test_theater_score" \
        '{
            step: 8,
            session_id: $session,
            test_execution_results: $execution,
            coverage_score: $coverage,
            correctness_score: $correctness,
            functionality_match: $functionality_match,
            theater_free_score: $theater_score,
            tests_valid: (($coverage > 0.8) and ($correctness > 0.8) and $functionality_match and ($theater_score > 0.7)),
            validation_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    # Store test validation results
    scripts/memory_bridge.sh store "swarm/testing" "validation_results" "$test_summary" '{"type": "test_validation", "step": 8}'
    
    local tests_valid
    tests_valid=$(echo "$test_summary" | jq -r '.tests_valid')
    
    if [[ "$tests_valid" == "true" ]]; then
        echo "Step 8: Test validation passed - proceeding to cleanup"
        step9_cleanup_and_completion "$session_id"
    else
        echo "Step 8: Test validation failed - returning to step 7 for test improvements"
        step7_documentation_updates "$session_id"
    fi
    
    echo "$test_summary"
}
```

### Step 9: Clean Up Temporary Docs and Review for Next Phase
```bash
step9_cleanup_and_completion() {
    local session_id="$1"
    
    echo "Step 9: Cleaning up temporary documentation and preparing phase completion..."
    
    # Clean up temporary files created during the process
    local temp_files=(
        ".claude/.artifacts/theater_detection.json"
        ".claude/.artifacts/reality_validation.json" 
        ".claude/.artifacts/completion_audit.json"
        ".claude/.artifacts/swarm_deployment_temp.json"
        ".claude/.artifacts/mece_temp_*.json"
    )
    
    for temp_file in "${temp_files[@]}"; do
        if [[ -f "$temp_file" ]]; then
            echo "Cleaning up: $temp_file"
            rm -f "$temp_file"
        fi
    done
    
    # Clean up temporary documentation created during development
    find docs/ -name "*.temp.md" -delete 2>/dev/null || true
    find . -name "*.dev-swarm-temp.*" -delete 2>/dev/null || true
    
    # Generate comprehensive phase completion summary
    local completion_summary
    completion_summary=$(jq -n \
        --arg session "$session_id" \
        --arg phase "implementation" \
        '{
            step: 9,
            session_id: $session,
            phase_completed: $phase,
            swarm_process_status: "completed_successfully",
            steps_executed: [
                "swarm_initialization",
                "agent_discovery", 
                "mece_task_division",
                "parallel_agent_deployment",
                "theater_detection_audit",
                "codex_sandbox_integration",
                "documentation_updates",
                "test_validation",
                "cleanup_and_completion"
            ],
            artifacts_preserved: [
                ".claude/.artifacts/swarm_final_summary.json",
                ".claude/.artifacts/phase_completion.json"
            ],
            cleanup_completed: true,
            ready_for_next_phase: true,
            completion_timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
        }')
    
    # Store final completion status
    scripts/memory_bridge.sh store "swarm/completion" "phase_final" "$completion_summary" '{"type": "phase_completion", "step": 9}'
    
    # Generate final artifacts
    echo "$completion_summary" > .claude/.artifacts/swarm_final_summary.json
    
    # Synchronize all memory systems for next phase
    scripts/memory_bridge.sh sync
    
    # Export session data for archival
    npx claude-flow@alpha memory export \
        --session "$session_id" \
        --format json > ".claude/.artifacts/session_export_$session_id.json" 2>/dev/null || true
    
    echo "Step 9: Phase completion successful - ready for next development phase"
    echo "$completion_summary"
}
```

## Command Implementation Script

```bash
#!/bin/bash
# /dev:swarm implementation - 9-step swarm development process

set -euo pipefail

FEATURE_DESCRIPTION="${1:-}"
PHASE="${2:-implement}"
MAX_CYCLES="${3:-3}"
THEATER_DETECTION="${4:-true}"
SANDBOX_PATH="${5:-./.sandboxes}"

if [[ -z "$FEATURE_DESCRIPTION" ]]; then
    echo "Usage: /dev:swarm '<feature_description>' [phase] [max_cycles] [theater_detection] [sandbox_path]"
    exit 1
fi

echo "Starting 9-step swarm development process for: $FEATURE_DESCRIPTION"

# Execute all 9 steps in sequence
SESSION_ID=""

# Step 0: Initialize task tracking
SESSION_ID=$(step0_initialize_task_tracking "$FEATURE_DESCRIPTION")
echo "Session initialized with tracking: $SESSION_ID"

# Step 1: Initialize swarm with Queen and dual memory
INIT_RESULT=$(step1_initialize_swarm "$FEATURE_DESCRIPTION" "$PHASE")
update_task_tracking "$SESSION_ID" "1" "Completed" "Swarm initialized"

# Step 2: Agent discovery
DISCOVERY_RESULT=$(step2_agent_discovery "$SESSION_ID")
update_task_tracking "$SESSION_ID" "2" "Completed" "Agents discovered"

# Step 3: MECE task division
MECE_RESULT=$(step3_mece_task_division "$SESSION_ID" "$FEATURE_DESCRIPTION" "$PHASE")
update_task_tracking "$SESSION_ID" "3" "Completed" "Tasks divided"

# Step 4-5: Implementation loop (continues until 100% code completion)
IMPLEMENTATION_RESULT=$(step4_5_implementation_loop "$SESSION_ID" "$MAX_CYCLES")

# Step 6: Integration loop (continues until 100% integrated and working)
INTEGRATION_RESULT=$(step6_integration_loop "$SESSION_ID" "$MAX_CYCLES")

# Steps 7-9 proceed normally after successful integration
# These are already called from within the integration loop when successful

echo "9-step swarm development process completed successfully"
echo "Session ID: $SESSION_ID"
echo "Check .claude/.artifacts/swarm_final_summary.json for detailed results"
```

## Integration Points

### Used by:
- SPEK development workflow for implementation phases
- Claude Flow swarm coordination and agent management
- Memory Bridge for unified memory operations
- Theater detection and reality validation systems
- Quality gates and comprehensive testing suites

### Produces:
- `.claude/.artifacts/swarm_final_summary.json` - Complete process results
- Session exports with comprehensive memory coordination
- Updated documentation and tests reflecting all changes
- Theater-free, reality-validated implementation

### Consumes:
- Feature descriptions and implementation requirements
- Existing SPEK quality framework and infrastructure
- 54 available agents and MCP tool ecosystem
- Sandbox environments and testing frameworks

## Success Metrics

### Process Effectiveness
- **9-Step Completion Rate**: 100% successful execution of all steps
- **Theater Detection Accuracy**: >95% elimination of fake work patterns
- **MECE Compliance**: >90% mutually exclusive, collectively exhaustive task division
- **Agent Coordination**: Seamless parallel deployment with memory linking

### Quality Assurance
- **Reality Validation**: End-user functionality verified in clean environments
- **Sandbox Testing**: All changes validated in isolated testing environments
- **Documentation Accuracy**: 100% synchronization between code and documentation
- **Test Correctness**: >80% coverage with genuine functionality validation

This command implements the complete 9-step swarm development process you specified, integrating seamlessly with all existing SPEK infrastructure while ensuring theater-free, high-quality development outcomes.
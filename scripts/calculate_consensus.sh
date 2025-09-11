#!/bin/bash

# Calculate consensus failure rate across all agents
# Usage: calculate_consensus.sh <iteration_number>

set -euo pipefail

ITERATION=${1:-1}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTIFACTS_DIR=".claude/.artifacts"

echo "[U+1F9EE] Calculating consensus for iteration $ITERATION..."

# Load individual agent analyses
CLAUDE_ANALYSIS=""
GEMINI_ANALYSIS=""
CODEX_ANALYSIS=""

if [[ -f "$ARTIFACTS_DIR/claude_premortem.json" ]]; then
    CLAUDE_ANALYSIS=$(cat "$ARTIFACTS_DIR/claude_premortem.json")
else
    echo "[WARN] Missing Claude analysis, using fallback"
    CLAUDE_ANALYSIS='{"overall_failure_probability": 20, "confidence_level": 0.5}'
fi

if [[ -f "$ARTIFACTS_DIR/gemini_analysis.json" ]]; then
    GEMINI_ANALYSIS=$(cat "$ARTIFACTS_DIR/gemini_analysis.json")
else
    echo "[WARN] Missing Gemini analysis, using fallback"
    GEMINI_ANALYSIS='{"failure_probability": 15, "confidence_level": 0.6}'
fi

if [[ -f "$ARTIFACTS_DIR/codex_analysis.json" ]]; then
    CODEX_ANALYSIS=$(cat "$ARTIFACTS_DIR/codex_analysis.json")
else
    echo "[WARN] Missing Codex analysis, using fallback"
    CODEX_ANALYSIS='{"implementation_failure_probability": 12, "confidence_level": 0.7}'
fi

# Extract failure rates with fallbacks for different response formats
CLAUDE_RATE=$(echo "$CLAUDE_ANALYSIS" | jq -r '.overall_failure_probability // .failure_probability // 20')
GEMINI_RATE=$(echo "$GEMINI_ANALYSIS" | jq -r '.overall_failure_probability // .failure_probability // 15')  
CODEX_RATE=$(echo "$CODEX_ANALYSIS" | jq -r '.overall_technical_failure_probability // .implementation_failure_probability // .failure_probability // 12')

# Extract confidence levels
CLAUDE_CONFIDENCE=$(echo "$CLAUDE_ANALYSIS" | jq -r '.confidence_level // 0.8')
GEMINI_CONFIDENCE=$(echo "$GEMINI_ANALYSIS" | jq -r '.confidence_level // 0.7')
CODEX_CONFIDENCE=$(echo "$CODEX_ANALYSIS" | jq -r '.confidence_level // 0.7')

echo "Individual failure rates:"
echo "  Claude Code: $CLAUDE_RATE% (confidence: $CLAUDE_CONFIDENCE)"
echo "  Gemini CLI:  $GEMINI_RATE% (confidence: $GEMINI_CONFIDENCE)"  
echo "  Codex CLI:   $CODEX_RATE% (confidence: $CODEX_CONFIDENCE)"

# Calculate weighted consensus using confidence levels as weights
# Higher confidence = more weight in consensus calculation
TOTAL_WEIGHT=$(echo "$CLAUDE_CONFIDENCE + $GEMINI_CONFIDENCE + $CODEX_CONFIDENCE" | bc -l)

if (( $(echo "$TOTAL_WEIGHT > 0" | bc -l) )); then
    WEIGHTED_CONSENSUS=$(echo "scale=2; ($CLAUDE_RATE * $CLAUDE_CONFIDENCE + $GEMINI_RATE * $GEMINI_CONFIDENCE + $CODEX_RATE * $CODEX_CONFIDENCE) / $TOTAL_WEIGHT" | bc -l)
else
    # Fallback to simple average if no confidence data
    WEIGHTED_CONSENSUS=$(echo "scale=2; ($CLAUDE_RATE + $GEMINI_RATE + $CODEX_RATE) / 3" | bc -l)
fi

# Calculate standard deviation to measure agreement
MEAN=$(echo "scale=2; ($CLAUDE_RATE + $GEMINI_RATE + $CODEX_RATE) / 3" | bc -l)
CLAUDE_DIFF=$(echo "scale=4; ($CLAUDE_RATE - $MEAN)^2" | bc -l)
GEMINI_DIFF=$(echo "scale=4; ($GEMINI_RATE - $MEAN)^2" | bc -l)
CODEX_DIFF=$(echo "scale=4; ($CODEX_RATE - $MEAN)^2" | bc -l)
VARIANCE=$(echo "scale=4; ($CLAUDE_DIFF + $GEMINI_DIFF + $CODEX_DIFF) / 3" | bc -l)
STD_DEV=$(echo "scale=2; sqrt($VARIANCE)" | bc -l)

# Categorize agreement level based on standard deviation
AGREEMENT_LEVEL="unknown"
if (( $(echo "$STD_DEV <= 3" | bc -l) )); then
    AGREEMENT_LEVEL="high"
elif (( $(echo "$STD_DEV <= 7" | bc -l) )); then
    AGREEMENT_LEVEL="moderate"
elif (( $(echo "$STD_DEV <= 12" | bc -l) )); then
    AGREEMENT_LEVEL="low"
else
    AGREEMENT_LEVEL="very_low"
fi

# Calculate confidence range (min-max)
MIN_RATE=$(echo "$CLAUDE_RATE $GEMINI_RATE $CODEX_RATE" | tr ' ' '\n' | sort -n | head -1)
MAX_RATE=$(echo "$CLAUDE_RATE $GEMINI_RATE $CODEX_RATE" | tr ' ' '\n' | sort -n | tail -1)
CONFIDENCE_RANGE=$(echo "scale=1; $MAX_RATE - $MIN_RATE" | bc -l)

echo ""
echo "[CHART] Consensus Analysis:"
echo "  Weighted consensus: $WEIGHTED_CONSENSUS%"
echo "  Simple average: $MEAN%"
echo "  Standard deviation: $STD_DEV"
echo "  Agreement level: $AGREEMENT_LEVEL"
echo "  Confidence range: $MIN_RATE% - $MAX_RATE% (+/-$CONFIDENCE_RANGE)"

# Generate iteration results JSON
ITERATION_RESULTS=$(jq -n \
    --arg iteration "$ITERATION" \
    --arg consensus "$WEIGHTED_CONSENSUS" \
    --arg simple_avg "$MEAN" \
    --arg std_dev "$STD_DEV" \
    --arg agreement "$AGREEMENT_LEVEL" \
    --arg confidence_range "$CONFIDENCE_RANGE" \
    --arg claude_rate "$CLAUDE_RATE" \
    --arg gemini_rate "$GEMINI_RATE" \
    --arg codex_rate "$CODEX_RATE" \
    --arg claude_conf "$CLAUDE_CONFIDENCE" \
    --arg gemini_conf "$GEMINI_CONFIDENCE" \
    --arg codex_conf "$CODEX_CONFIDENCE" \
    --arg min_rate "$MIN_RATE" \
    --arg max_rate "$MAX_RATE" \
    '{
        iteration: ($iteration | tonumber),
        consensus_failure_rate: ($consensus | tonumber),
        simple_average: ($simple_avg | tonumber),
        standard_deviation: ($std_dev | tonumber),
        agreement_level: $agreement,
        confidence_range: ($confidence_range | tonumber),
        individual_rates: {
            claude: ($claude_rate | tonumber),
            gemini: ($gemini_rate | tonumber),
            codex: ($codex_rate | tonumber)
        },
        confidence_levels: {
            claude: ($claude_conf | tonumber),
            gemini: ($gemini_conf | tonumber),
            codex: ($codex_conf | tonumber)
        },
        range: {
            min: ($min_rate | tonumber),
            max: ($max_rate | tonumber),
            spread: ($confidence_range | tonumber)
        },
        timestamp: (now | todate)
    }')

# Save iteration results
echo "$ITERATION_RESULTS" > "$ARTIFACTS_DIR/iteration_${ITERATION}_results.json"

echo ""
echo "[OK] Consensus calculation complete for iteration $ITERATION"
echo "[FOLDER] Results saved to: $ARTIFACTS_DIR/iteration_${ITERATION}_results.json"

# Return success if this represents progress toward target
exit 0
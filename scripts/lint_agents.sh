#!/bin/bash

# Agent Lint Script - Validates SPEK-AUGMENT v1 compliance
# Scans .claude/agents/*.md and ensures proper markers and JSON contracts

set -euo pipefail

echo "🔍 Agent Lint: SPEK-AUGMENT v1 Compliance Check"
echo "=============================================="

AGENT_FILES=($(find .claude/agents -name "*.md" | sort))
TOTAL_FILES=${#AGENT_FILES[@]}
ERRORS=0
WARNINGS=0

echo "📊 Scanning ${TOTAL_FILES} agent files..."
echo ""

# Check each agent file
for file in "${AGENT_FILES[@]}"; do
    echo -n "🔎 $(basename "$file" .md)... "
    
    FILE_ERRORS=0
    
    # Required markers check
    if ! grep -q "<!-- SPEK-AUGMENT v1: header -->" "$file"; then
        echo "❌ MISSING: SPEK-AUGMENT v1 header marker"
        ((ERRORS++))
        ((FILE_ERRORS++))
    fi
    
    if ! grep -q "<!-- /SPEK-AUGMENT v1 -->" "$file"; then
        echo "❌ MISSING: SPEK-AUGMENT v1 header closing marker"
        ((ERRORS++))
        ((FILE_ERRORS++))
    fi
    
    if ! grep -q "<!-- SPEK-AUGMENT v1: mcp -->" "$file"; then
        echo "❌ MISSING: SPEK-AUGMENT v1 MCP footer marker"
        ((ERRORS++))
        ((FILE_ERRORS++))
    fi
    
    # Role placeholder check
    if grep -q "<ROLE>" "$file"; then
        echo "❌ ERROR: <ROLE> placeholder not substituted"
        ((ERRORS++))
        ((FILE_ERRORS++))
    fi
    
    # JSON contract validation
    if ! grep -qi "Only JSON\\. No prose\\." "$file"; then
        echo "⚠️  WARNING: Missing 'Only JSON. No prose.' in Output section"
        ((WARNINGS++))
    fi
    
    # Artifact contract check
    if ! grep -q "plan\\.json\\|impact\\.json\\|codex_summary\\.json\\|qa\\.json" "$file"; then
        echo "⚠️  WARNING: No recognized artifact contracts mentioned"
        ((WARNINGS++))
    fi
    
    # Duplicate marker check
    HEADER_COUNT=$(grep -c "SPEK-AUGMENT v1: header" "$file" || echo "0")
    if [ "$HEADER_COUNT" -gt 1 ]; then
        echo "❌ ERROR: Duplicate SPEK-AUGMENT v1 header markers ($HEADER_COUNT found)"
        ((ERRORS++))
        ((FILE_ERRORS++))
    fi
    
    MCP_COUNT=$(grep -c "SPEK-AUGMENT v1: mcp" "$file" || echo "0")
    if [ "$MCP_COUNT" -gt 1 ]; then
        echo "❌ ERROR: Duplicate SPEK-AUGMENT v1 MCP markers ($MCP_COUNT found)"
        ((ERRORS++))
        ((FILE_ERRORS++))
    fi
    
    # Success message if no errors
    if [ "$FILE_ERRORS" -eq 0 ]; then
        echo "✅ PASS"
    fi
done

echo ""
echo "📊 Lint Results:"
echo "   ✅ Passed: $((TOTAL_FILES - ERRORS)) files"
echo "   ❌ Errors: $ERRORS"
echo "   ⚠️  Warnings: $WARNINGS"
echo ""

if [ "$ERRORS" -eq 0 ]; then
    echo "🎉 All agent files pass SPEK-AUGMENT v1 compliance!"
    exit 0
else
    echo "💥 Found $ERRORS compliance errors. Please fix before proceeding."
    exit 1
fi
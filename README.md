# S-R-P-E-K Enhanced Development Template

## 🚀 Overview

This template extends **GitHub's Spec Kit** with **Research Intelligence** and **Theater Detection**, integrating **Claude Flow**, **Gemini CLI**, **Codex CLI**, **Connascence Analysis**, **Semgrep Security**, and **Plane MCP** to create the most comprehensive AI-driven, quality-gated, reality-validated development environment available.

**Key Enhancements:**
- **🔬 Research Phase**: Discover existing solutions before building from scratch (30-60% faster development)
- **🎭 Theater Detection**: Eliminate completion theater and validate genuine quality improvements
- **🧠 Reality Validation**: Evidence-based verification of functionality and quality claims

## 📚 Spec-Driven Development (Spec Kit)

This template follows GitHub's **Spec Kit** process end-to-end (Specify → Plan → Tasks/Discover → Implement → Verify → Review → Deliver → Learn).  
- **Spec Kit repo:** canonical docs, CLI usage, and process overview.  
- **Deep dive:** `spec-driven.md` explains the phases and how agents consume the spec.  
- **Getting started blog:** short intro with examples using Copilot, Claude Code, and Gemini CLI.

**Links**
- Spec Kit repository: https://github.com/github/spec-kit  
- Detailed process (`spec-driven.md`): https://github.com/github/spec-kit/blob/main/spec-driven.md  
- "Get started" blog announcement: https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/

## 🔄 Enhanced S-R-P-E-K Workflow

**Specification → Research → Planning → Execution → Knowledge**

### Enhanced Methodology: Adding Research Phase

S-R-P-E-K extends traditional SPEK by adding a dedicated **Research phase** between Specification and Planning, dramatically reducing development time by discovering existing solutions before building from scratch.

### How Claude Flow Orchestrates Each Phase:

1. **SPECIFY** (`SPEC.md`) - Define requirements clearly
   - Gather and document requirements
   - Define acceptance criteria and project scope
   - Create technical specifications
   - **Commands**: `/specify`, `/spec:plan`

2. **RESEARCH** (NEW) - Discover existing solutions before building
   - Web search for existing solutions and alternatives
   - GitHub repository analysis for code quality and reusability
   - AI model research for specialized integration needs
   - Deep technical research for implementation guidance
   - **Commands**: `/research:web`, `/research:github`, `/research:models`, `/research:deep`, `/research:analyze`

3. **PLAN** (`/spec:plan`) - Convert spec to structured JSON tasks incorporating research
   - Incorporate research findings into technical planning
   - Design architecture leveraging existing solutions
   - Plan component extraction and integration
   - **Commands**: `/plan`, `/gemini:impact`

4. **EXECUTE** - Route by complexity using research-informed approach:
   - `small` → `/codex:micro` (sandboxed, ≤25 LOC, ≤2 files)
   - `multi` → `/fix:planned` (checkpointed steps)
   - `big` → Gemini context → planned approach
   - Apply research-backed best practices and integrate external solutions

5. **KNOWLEDGE** - Learn from process and validate against research predictions:
   - **VERIFY** (`/qa:run`) - Automated QA gates (tests/typecheck/lint/coverage)
   - **REVIEW** (`/qa:analyze`) - Failure triage → routing strategy  
   - **DELIVER** (`/pr:open`) - Evidence-based PR preparation
   - **LEARN** - Memory persistence via MCP with research effectiveness tracking

### Research Phase Benefits
- **30-60% faster development** for common features through component reuse
- **Improved solution quality** by building on battle-tested libraries
- **Better architectural decisions** based on comprehensive research
- **Knowledge building** with organizational solution evaluation database

### S-R-P-E-K Workflow Examples

**Simple Feature Development:**
```bash
# 1. SPECIFY: Define requirements
vim SPEC.md

# 2. RESEARCH: Find existing solutions
/research:web 'react form validation library'
/research:github 'formik react-hook-form comparison'

# 3. PLAN: Incorporate research findings
/spec:plan

# 4. EXECUTE: Implement with best solution
/codex:micro 'integrate react-hook-form based on research'

# 5. KNOWLEDGE: Validate and deliver
/qa:run && /theater:scan && /pr:open
```

**Complex System with Theater Detection:**
```bash
# 1. SPECIFY: Multi-tenant auth requirements
vim SPEC.md

# 2. RESEARCH: Comprehensive solution discovery
/research:web 'multi-tenant authentication SaaS patterns' comprehensive technical
/research:github 'auth0 supertokens firebase-auth comparison' 0.8 all
/research:analyze "$(cat .claude/.artifacts/research-*.json)" synthesis roadmap

# 3. PLAN: Research-informed implementation strategy
/spec:plan
/gemini:impact 'implement hybrid auth0-supertokens system'

# 4. EXECUTE: Multi-phase implementation
/fix:planned 'auth system implementation per research roadmap'

# 5. KNOWLEDGE: Reality-validated delivery
/qa:run && /conn:scan && /theater:scan --quality-correlation && /pr:open
```

## 🔄 Integrated Loop System

### Three Interconnected Loops for Complete Development Lifecycle

The S-R-P-E-K template orchestrates **three interconnected loops** that work together to ensure high-quality, reality-validated delivery while maintaining continuous development velocity.

#### 🔍 Loop 1: Spec-Plan-Research-Premortem Loop
**Discovery and Planning Phase - Prevents Issues Before They Start**

```bash
# Continuous refinement loop until plan is solid
SPEC.md → /research:web → /research:github → /research:analyze → /spec:plan → premortem → refine → repeat
```

**Key Characteristics:**
- **Research-First Approach**: Discover existing solutions before building from scratch (30-60% faster development)
- **Premortem Integration**: Identify failure modes during planning, not during implementation
- **Evidence-Based Planning**: Use research findings to inform architectural decisions
- **Parallel Research Execution**: Web, GitHub, models, and deep research run concurrently
- **Risk Mitigation**: Plan refinement continues until premortem reveals acceptable risk levels

**Loop Termination Criteria:**
- ✅ Comprehensive research findings with solution recommendations
- ✅ Structured plan.json with research-informed tasks
- ✅ Premortem analysis shows manageable risks
- ✅ Clear implementation strategy with fallback options

#### ⚡ Loop 2: Development Loop with CI/CD Integration  
**Parallel Implementation and Continuous Audit - Maintains Quality at Velocity**

```bash
# Parallel execution with continuous safety checks
Implementation → Analyzer (Parallel) → Safe Audit → Sandbox → Surgical Edits → GitHub Hooks → Repeat
```

**Parallel Execution Architecture:**
```bash
# All quality gates run simultaneously for maximum speed
Parallel {
  /qa:run --architecture --performance-monitor,
  /conn:scan --detector-pools --enhanced-metrics,  
  /sec:scan --owasp --custom-rules,
  /theater:scan --quality-correlation,
  /conn:arch --hotspots --recommendations
}
```

**Key Characteristics:**
- **Parallel Quality Gates**: All analyzers run simultaneously (2.8-4.4x speed improvement)
- **Safe Sandbox Execution**: Auto-branch creation, isolated testing, clean rollback capabilities
- **Surgical Edit System**: Bounded modifications (≤25 LOC, ≤2 files) with immediate verification
- **GitHub Hooks Integration**: Automated quality checks, PR preparation, evidence packaging
- **Continuous Safety**: Every change verified before integration, with automatic rollback on failure

**Safety Mechanisms:**
```json
// .claude/settings.json hooks configuration
{
  "hooks": {
    "preTool": [
      {"match": "codex exec", "cmd": "test -z \"$(git status --porcelain)\" || git stash -k -u"},
      {"match": "codex exec", "cmd": "git checkout -b codex/task-$(date +%s)"}
    ],
    "postTool": [
      {"match": "codex exec", "cmd": "git status --porcelain && echo 'Review with: git diff --stat'"},
      {"match": "qa:run", "cmd": ".claude/scripts/evidence-package.sh"}
    ]
  }
}
```

**Loop Operations:**
- **Implementation Phase**: Route by complexity (`/codex:micro` for small, `/fix:planned` for multi-file)
- **Parallel Analyzer Phase**: 9 connascence detectors, security scanning, architectural analysis
- **Safe Audit Phase**: Evidence packaging, quality gate evaluation, theater detection
- **Surgical Edit Phase**: Bounded fixes with immediate verification and rollback capability
- **GitHub Integration**: Automated PR creation, reviewer assignment, evidence attachment

#### 🎭 Loop 3: Theater Detection Reality Loop
**Continuous Validation - Prevents Fake Work and Ensures Genuine Quality**

```bash
# Continuous reality validation throughout development
Claims → Evidence Cross-Check → Pattern Detection → Quality Contradiction Analysis → Reality Validation → Learning → Repeat
```

**Multi-Layer Detection System:**
```bash
# Theater detection runs across all development phases
/theater:scan --patterns {
  code_theater,           # Mock-heavy implementations
  test_theater,          # Non-functional test content  
  quality_infrastructure, # Gaming quality gates
  security_theater,      # Fake vulnerability fixes
  performance_theater    # Unrealistic benchmarks
}
```

**Key Characteristics:**
- **Continuous Pattern Recognition**: Learns organizational theater patterns over time
- **Evidence Cross-Reference**: Validates completion claims against actual code changes
- **Quality Contradiction Detection**: Identifies conflicts between metrics and reality
- **Reality Validation Framework**: Tests that functionality actually works as claimed
- **Learning Integration**: Builds knowledge base of theater patterns for future detection

**Integration Points:**
- **Research Phase**: Validates discovered solutions against theater patterns
- **Quality Gates**: Theater detection runs alongside traditional quality checks
- **CI/CD Pipeline**: Automated theater scanning blocks PRs on high-confidence findings
- **Evidence Packages**: Theater detection results included in audit trails

### 🔗 Loop Integration & Coordination

#### Parallel Execution Capabilities
**All loops can run simultaneously for maximum efficiency:**

```bash
# Complete parallel execution in single message
Parallel {
  # Loop 1: Research and planning
  /research:web + /research:github + /research:analyze,
  
  # Loop 2: Quality and architecture analysis  
  /qa:run + /conn:scan + /sec:scan + /conn:arch,
  
  # Loop 3: Theater detection and reality validation
  /theater:scan + /reality:check,
  
  # Infrastructure: GitHub integration
  GitHub hooks + Evidence packaging + PR preparation
}
```

#### Cross-Loop Communication
- **Research → Development**: Research findings inform implementation approach and architectural decisions
- **Development → Theater Detection**: Code changes trigger theater pattern analysis and reality validation
- **Theater Detection → Research**: Theater patterns influence future solution evaluation criteria
- **All Loops → GitHub**: Evidence from all three loops packaged for PR documentation and audit trails

#### Loop Coordination Protocol
```yaml
# .github/workflows/integrated-loops.yml
name: Integrated Loop System
on: [push, pull_request]
jobs:
  loop-coordination:
    runs-on: ubuntu-latest
    steps:
      - name: Initialize All Loops
        run: |
          # Start all three loops in parallel
          ./scripts/loop-coordinator.sh --mode parallel --loops all
      
      - name: Cross-Loop Validation  
        run: |
          # Validate consistency across loop outputs
          ./scripts/cross-loop-validator.sh --evidence-package
          
      - name: Reality Check Integration
        run: |
          # Final reality validation before merge
          ./scripts/reality-validator.sh --comprehensive
```

#### Success Metrics Across Loops

**Loop 1 - Research & Planning:**
- 30-60% development time reduction through solution reuse
- 90%+ plan accuracy with reduced implementation surprises
- Premortem risk mitigation prevents 80%+ of potential issues

**Loop 2 - Development & Quality:**
- 2.8-4.4x speed improvement through parallel execution
- 100% quality gate pass rate with evidence packages
- Zero production defects through surgical edit safety

**Loop 3 - Theater Detection:**
- >90% theater pattern recognition accuracy
- <5% false positive rate for legitimate code
- Improved stakeholder confidence through reality validation

#### Emergency Protocols
```bash
# Loop failure recovery procedures
if loop1_failure; then
  ./scripts/research-recovery.sh --fallback-plan
fi

if loop2_failure; then  
  git worktree prune && git checkout main  # Clean rollback
  ./scripts/quality-gate-bypass.sh --emergency-mode
fi

if loop3_failure; then
  ./scripts/manual-validation.sh --human-review
fi
```

**The integrated loop system ensures that every change is research-informed, quality-gated, and reality-validated while maintaining maximum development velocity through parallel execution and surgical safety mechanisms.**

## 🛠️ Comprehensive Tool Integration

### Core Quality Stack
- **Connascence Analyzer** - Advanced structural quality analysis with 70 Python files (25,640 LOC)
  - **9 Specialized Detectors**: CoM, CoP, CoA, CoT, CoV, CoE, CoI, CoN, CoC with NASA JPL POT10 compliance
  - **God Object Detection**: Context-aware detection with domain-specific thresholds
  - **MECE Duplication Analysis**: Mutually Exclusive, Collectively Exhaustive duplication detection
  - **Architecture Analysis**: Cross-phase correlation, smart integration engine, detector pools
  - **Performance Monitoring**: Built-in benchmarking, resource tracking, streaming analysis
  - **Smart Recommendations**: AI-powered architectural guidance with 35+ NASA compliance files
- **Semgrep Security** - OWASP Top 10 + custom security rules
- **TypeScript** - Strict type safety with comprehensive checks
- **ESLint** - Code style + security plugin enforcement
- **Jest** - Test framework with coverage analysis
- **Differential Coverage** - Coverage tracking on changed files only

### AI Agent Coordination
- **Claude Flow** - Orchestrates multi-agent workflows
- **Claude Code** - 17 specialized slash commands for SPEK loop
- **Gemini CLI** - Large-context analysis and impact mapping
- **Codex CLI** - Sandboxed micro-edits with safety constraints
- **Plane MCP** - Project management synchronization

### Quality Gates (All Must Pass)
- ✅ **Tests**: 100% pass rate  
- ✅ **TypeCheck**: Zero compilation errors
- ✅ **Lint**: Zero errors (warnings with justification)
- ✅ **Security**: Zero critical, ≤5 high findings
- ✅ **Connascence**: NASA compliance ≥90%, duplication score ≥0.75, ≤25 god objects
- ✅ **Architecture**: Cross-phase correlation analysis, smart integration engine validation
- ✅ **Coverage**: No regression on changed lines

### MCP Server Assignments by Phase:

| Phase | MCP Servers | Purpose |
|-------|-------------|---------|
| **PLAN** | Sequential Thinking, Memory, Context7 | Structure reasoning, recall patterns |
| **DISCOVER** | Ref, DeepWiki, Firecrawl, Huggingface, MarkItDown | Research, normalize content |
| **IMPLEMENT** | Github, MarkItDown | Code management, documentation |
| **VERIFY** | Playwright, eva | End-to-end testing, evaluation |
| **REVIEW/DELIVER** | Github, MarkItDown | PR management, release notes |
| **LEARN** | Memory, Ref | Store lessons, reference sources |

## 🛠️ Prerequisites & Infrastructure Setup

### Required API Keys & Accounts
- **Claude Code Subscription** - Essential for the development environment
- **Gemini API Key** - For large-context analysis (`GEMINI_API_KEY`)
- **Codex API Access** - For sandboxed micro-edits
- **GitHub Account** - For Spec Kit integration and repository management
- **Plane API** (Optional) - For project management sync (`PLANE_*` env vars)

### Required CLI Tools & Software
```bash
# Core Development Tools
node >= 18.0.0 && npm >= 8.0.0     # Node.js runtime
python >= 3.8                      # Python for analyzers
git >= 2.30                        # Version control

# AI & Analysis Tools  
claude-code                        # Primary development environment
gemini-cli                         # Large context analysis
codex-cli                          # Sandboxed edits
semgrep                            # Security scanning
pip-audit                          # Python security audit
```

### MCP Servers (Install via Claude MCP)
```bash
# Core MCP Servers for SPEK phases
claude mcp add github             # GitHub integration
claude mcp add memory             # Cross-session persistence
claude mcp add sequential-thinking # Structured reasoning
claude mcp add context7           # Context management
claude mcp add ref                # Reference management
claude mcp add deepwiki           # Research capabilities
claude mcp add firecrawl          # Web content extraction  
claude mcp add huggingface        # AI model access
claude mcp add markit-down        # Markdown processing
claude mcp add playwright         # End-to-end testing
claude mcp add eva                # Evaluation framework
```

### GitHub Spec Kit Installation
```bash
# Install GitHub's Spec Kit globally
npm install -g @github/spec-kit

# Verify installation
spec-kit --version
```

### Claude Flow Setup
```bash
# Install Claude Flow v2 Alpha
npm install -g claude-flow@alpha

# Add Claude Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Verify installation
npx claude-flow@alpha --version
```

### Environment Variables Setup
Create `.env` file with required credentials:
```bash
# AI Services
GEMINI_API_KEY=your_gemini_key_here
CODEX_API_KEY=your_codex_key_here

# Plane Project Management (Optional)
PLANE_API_URL=https://your-plane-instance.com
PLANE_TOKEN=your_plane_token
PLANE_PROJECT_ID=your_project_id  
PLANE_WORKSPACE_SLUG=your_workspace
PLANE_CYCLE_ID=current_cycle_id

# Security & Compliance
SEMGREP_TOKEN=your_semgrep_token   # For private rules
GITHUB_TOKEN=ghp_your_token        # For enhanced GitHub integration

# Quality Gates Profile
GATES_PROFILE=full                 # Options: full, light, docs
```

### Directory Structure Preparation
```bash
# Create required directories
mkdir -p .claude/{.artifacts,commands,agents}
mkdir -p {src,tests,docs,configs,scripts,examples,flow/workflows}
mkdir -p {gemini,memory,templates}
```

## 🎯 Quick Start

1. **Setup Dependencies**:
   ```bash
   npm install                    # Install Node.js dependencies
   pip install -e ./analyzer     # Install connascence analyzer
   pip install semgrep pip-audit # Install security tools
   
   # Verify all tools are installed
   claude --version && gemini --version && semgrep --version
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env` and fill in your API keys
   - Edit `configs/plane.json` with your Plane API credentials (if using)
   - Review `configs/codex.json` for budget constraints
   - Adjust `configs/.semgrep.yml` for custom security rules

3. **Start Development with S-R-P-E-K Workflow**:
   ```bash
   # 1. Edit SPEC.md with your requirements
   # 2. Research existing solutions (NEW!)
   /research:web 'user authentication system for SaaS applications'
   /research:github 'auth0 supertokens authentication comparison'
   /research:analyze "$(cat .claude/.artifacts/research-*.json)" synthesis
   
   # 3. Generate plan incorporating research findings
   /spec:plan
   
   # 4. Execute full workflow  
   flow run flow/workflows/spec-to-pr.yaml
   
   # OR for post-edit quality loop with theater detection
   flow run flow/workflows/after-edit.yaml
   
   # OR for CI auto-repair with reality validation
   flow run flow/workflows/ci-auto-repair.yaml
   ```

4. **Available Commands**: 22 specialized slash commands organized by S-R-P-E-K workflow phases:

   ### Core SPEK Commands
   ```bash
   /spec:plan          # Convert SPEC.md → structured plan.json
   /specify            # Define project requirements (Spec Kit native)
   /plan               # Specify technical implementation (Spec Kit native)
   /tasks              # Create actionable task list (Spec Kit native)
   ```

   ### Research Commands (NEW)
   ```bash
   /research:web       # Comprehensive web search for existing solutions
   /research:github    # GitHub repository analysis for code quality
   /research:models    # AI model research for specialized integration
   /research:deep      # Deep technical research for implementation guidance
   /research:analyze   # Large-context synthesis of research findings
   ```

   ### Analysis & Impact
   ```bash
   /gemini:impact      # Large-context change impact analysis
   /qa:analyze         # Analyze failures and route repair strategies
   ```
   
   ### Implementation Commands
   ```bash
   /codex:micro        # Sandboxed micro-edits (≤25 LOC, ≤2 files)
   /codex:micro-fix    # Surgical fixes for test failures in sandbox
   /fix:planned        # Multi-file fixes with bounded checkpoints
   ```
   
   ### Quality Assurance & Theater Detection
   ```bash
   /qa:run             # Comprehensive QA suite (tests/lint/types/coverage)
   /qa:gate            # Apply CTQ thresholds for gate decisions
   /theater:scan       # Performance theater detection in code and quality infrastructure
   /reality:check      # Reality validation for completion claims
   ```
   
   ### Security & Architecture
   ```bash
   /sec:scan           # Semgrep security scanning with OWASP rules
   /conn:scan          # Advanced connascence analysis with 9 detector modules
   /conn:arch          # Architectural analysis with detector pools & smart recommendations
   ```
   
   ### Project Management & Delivery
   ```bash
   /pm:sync            # Bidirectional sync with Plane MCP
   /pr:open            # Evidence-rich pull request creation
   ```

   > 📖 **Complete documentation**: See `docs/S-R-P-E-K-METHODOLOGY.md` for research methodology, `docs/ANALYZER-CAPABILITIES.md` for full analyzer matrix, `docs/CLI-INTEGRATION-GAPS.md` for enhancement roadmap, and `examples/` for tutorials

## 🏗️ Project Structure

```
├── .claude/
│   ├── commands/          # Claude Code slash commands
│   ├── .artifacts/        # QA outputs, analysis results
│   └── settings.json      # Hooks configuration
├── flow/workflows/        # Claude Flow YAML workflows
├── gemini/               # Gemini CLI outputs
├── memory/               # Spec Kit constitution & memory
├── scripts/              # Utility scripts
├── templates/            # Spec Kit templates
├── SPEC.md              # Main specification
└── AGENTS.md            # Codex proof rules & gates
```

## 🚦 Quality Gates

All changes must pass:
- **Tests**: `npm test --silent`
- **Type checking**: `npm run typecheck` 
- **Linting**: `npm run lint --silent`
- **Coverage**: No regression on changed lines

## 🔄 Flow Workflows

- **`spec-to-pr.yaml`**: Complete SPEC → PR cycle with PM sync
- **`after-edit.yaml`**: Post-edit QA with intelligent repair routing
- **`ci-auto-repair.yaml`**: Automated failure analysis and bounded fixes

## 🤖 CI/CD Integration

### Enhanced Quality Pipeline with Theater Detection
- **`.github/workflows/quality-gates.yml`**: Defense industry ready with comprehensive gates
  - **9 Connascence Detectors**: CoM, CoP, CoA, CoT, CoV, CoE, CoI, CoN, CoC analysis
  - **God Object Detection**: Context-aware analysis with ≤25 object threshold
  - **MECE Duplication Analysis**: Comprehensive duplication scoring ≥0.75
  - **Architecture Analysis**: Detector pools, enhanced metrics, cross-component correlation
  - **NASA POT10 Compliance**: Full defense industry standards with ≥90% compliance
  - **Theater Detection**: Performance theater pattern detection in code and quality infrastructure
- **`.github/workflows/connascence-analysis.yml`**: Specialized connascence pipeline
- **`.github/workflows/nasa-compliance-check.yml`**: Defense industry compliance validation
- **`.github/workflows/auto-repair.yml`**: Intelligent repair with failure analysis routing
- **`.github/workflows/theater-detection.yml`**: Automated theater detection and reality validation

### Advanced Reporting & Integration
- **SARIF Integration**: Connascence findings appear in GitHub Security tab
- **Quality Gate Reports**: Comprehensive JSON artifacts with pass/fail decisions
- **Defense Industry Status**: Real-time compliance tracking and approval
- **Evidence Artifacts**: Complete quality audit trail with architectural insights

## 🎯 Safety & Evidence

### Bounded Operations
- **Micro-edits**: ≤25 LOC, ≤2 files, sandbox execution
- **Safe branching**: Auto-stash, throwaway branches via git worktree
- **Quality gates**: Changed-files-only analysis for efficiency

### Evidence Package (Every Change)
- **qa.json**: Test, typecheck, lint, coverage results
- **semgrep.sarif**: Security findings (GitHub Security integration)  
- **connascence_full.json**: Complete 9-detector analysis with NASA compliance
- **god_objects.json**: God object detection with architectural recommendations
- **mece_analysis.json**: MECE duplication scoring and consolidation opportunities
- **architecture_analysis.json**: Cross-component analysis with detector pool insights
- **connascence_analysis.sarif**: Connascence findings for GitHub Security tab
- **quality_gates_report.json**: Comprehensive gate evaluation with defense industry status
- **diff_coverage.json**: Coverage analysis on changed lines
- **theater_scan.json**: Performance theater detection results with quality contradiction analysis
- **reality_validation.json**: Reality validation results for completion claims
- **research_findings.json**: Research phase outputs with solution recommendations
- **SPC metrics**: Statistical process control data with quality trend analysis

### Governance Framework
- **Quality Policy** (`QUALITY.md`): Zero-defect delivery standards
- **CTQ Requirements** (`docs/CTQ.md`): Critical-to-quality metrics  
- **Testing Doctrine** (`tests/README.md`): Black-box testing only
- **SIPOC Process** (`docs/SIPOC.md`): Lean Six Sigma analysis

> Tip: If you prefer starting from the official Claude template bundle, grab the latest **`spec-kit-template-claude-*.zip`** from the releases page and layer this repo's Flow/commands on top.

## 🎭 Theater Detection & Reality Validation

### Performance Theater Detection System

The SPEK template includes a comprehensive **Theater Detection System** designed to identify and eliminate completion theater patterns - where work appears complete but lacks functional implementation or genuine quality improvements.

#### Theater Detection Capabilities

**🔍 Multi-Layer Pattern Detection:**
- **Code Theater**: Mock-heavy implementations claiming real functionality
- **Test Theater**: Tests that print success without actual verification  
- **Quality Infrastructure Theater**: Gaming quality gates and metrics manipulation
- **Security Theater**: Marking vulnerabilities "resolved" without actual fixes
- **Performance Theater**: Benchmarks with unrealistic data or scenarios

**🔗 Quality Gate Integration:**
- **Connascence Analysis**: Detects architectural "improvements" without genuine coupling reduction
- **Security Scanning**: Cross-references SARIF findings with actual code changes
- **Test Coverage**: Identifies high coverage with non-functional test content
- **Performance Monitoring**: Validates performance claims against actual measurements

#### Reality Validation Framework

**📊 Evidence-Based Verification:**
- **Quality Contradiction Analysis**: Identifies conflicts between claims and evidence
- **Git History Cross-Reference**: Validates completion claims against actual changes
- **Functional Verification**: Tests that functionality actually works as claimed
- **Pattern Learning**: Builds organizational knowledge of theater patterns

**🎯 Theater Detection Commands:**

```bash
# Comprehensive theater detection across all layers
/theater:scan --scope comprehensive --quality-correlation

# Reality validation for specific completion claims
/reality:check "user authentication system implementation"

# Automated theater detection in quality infrastructure  
/theater:scan --patterns quality_infrastructure --evidence-level high
```

#### Integration with S-R-P-E-K Workflow

**Research Phase Integration:**
- Research findings validate against theater patterns in discovered solutions
- Solution quality scoring includes theater detection indicators
- Community health metrics identify projects with theater tendencies

**Quality Gates Enhancement:**
- Theater detection runs alongside traditional quality gates
- Quality contradictions trigger additional validation requirements
- Evidence packages include theater detection results for audit trails

**Continuous Validation:**
- CI/CD pipelines include automated theater detection
- Pull requests blocked on high-confidence theater findings
- Quality reports include theater detection summaries with remediation guidance

#### Theater Pattern Examples

**Code Theater Pattern:**
```javascript
// THEATER: Claims integration but uses mocks
function authenticateUser(credentials) {
  console.log('✓ User authentication successful');
  return { success: true }; // No actual authentication
}
```

**Quality Infrastructure Theater:**
```yaml
# THEATER: Claims architectural improvement
architectural_health: 0.95  # Claimed improvement
actual_coupling: increased  # Reality: coupling got worse
god_objects: renamed_not_refactored  # Cosmetic changes only
```

**Test Theater Pattern:**
```javascript
// THEATER: Test that always passes
test('integration test passes', () => {
  console.log('✓ Integration test completed successfully');
  expect(true).toBe(true); // No actual integration tested
});
```

#### Success Metrics

**Theater Detection Effectiveness:**
- Pattern Recognition Accuracy: >90% theater patterns correctly identified
- False Positive Rate: <5% legitimate code incorrectly flagged
- Quality Gate Reliability: Improved trustworthiness of quality infrastructure
- Development Velocity: Faster delivery through elimination of false completion

**Reality Validation Impact:**
- Reduced production defects through genuine quality improvements
- Increased stakeholder confidence in delivery claims
- Improved team accountability and quality culture
- Enhanced organizational learning through pattern recognition

> **📖 Deep Dive**: See `docs/GUARDRAILS.md` for comprehensive theater detection patterns, `.claude/commands/theater-scan.md` for detailed implementation, and `.claude/agents/theater-killer.md` for specialized theater elimination strategies.

---

**Ready to build with specification-driven development and reality-validated delivery!** 🚀
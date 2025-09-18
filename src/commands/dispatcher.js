/**
 * SPEK Slash Command Dispatcher
 * Unified routing system for all 38 slash commands with VS Code MCP integration
 */

const path = require('path');
const { CommandRegistry } = require('./registry');
const { CommandExecutor } = require('./executor');
const { CommandValidator } = require('./validator');

class SlashCommandDispatcher {
    constructor() {
        this.registry = new CommandRegistry();
        this.executor = new CommandExecutor();
        this.validator = new CommandValidator();

        // MCP server integration flags
        this.mcpServers = {
            'claude-flow': false,
            'memory': false,
            'sequential-thinking': false,
            'filesystem': false,
            'ide': false,
            'github': false,
            'playwright': false,
            'puppeteer': false,
            'eva': false,
            'figma': false,
            'plane': false,
            'deepwiki': false,
            'firecrawl': false,
            'ref': false,
            'ref-tools': false,
            'context7': false,
            'markitdown': false,
            'everything': false
        };

        // Initialize command registry
        this.initializeCommands();

        // Check MCP server availability
        this.checkMCPAvailability();
    }

    /**
     * Initialize all 38 slash commands
     */
    initializeCommands() {
        // Research & Discovery Commands (5)
        this.registry.register('/research:web', {
            description: 'Comprehensive web search for existing solutions',
            category: 'research',
            mcpRequired: ['firecrawl', 'context7'],
            handler: 'research-web'
        });

        this.registry.register('/research:github', {
            description: 'GitHub repository analysis for code quality',
            category: 'research',
            mcpRequired: ['github', 'deepwiki'],
            handler: 'research-github'
        });

        this.registry.register('/research:models', {
            description: 'AI model research for specialized integration',
            category: 'research',
            mcpRequired: ['ref', 'ref-tools'],
            handler: 'research-models'
        });

        this.registry.register('/research:deep', {
            description: 'Deep technical research for implementation guidance',
            category: 'research',
            mcpRequired: ['deepwiki', 'context7'],
            handler: 'research-deep'
        });

        this.registry.register('/research:analyze', {
            description: 'Large-context synthesis of research findings',
            category: 'research',
            mcpRequired: ['memory'],
            handler: 'research-analyze'
        });

        // Planning & Architecture Commands (6)
        this.registry.register('/spec:plan', {
            description: 'Convert SPEC.md to structured plan.json',
            category: 'planning',
            mcpRequired: ['filesystem'],
            handler: 'spec-plan'
        });

        this.registry.register('/specify', {
            description: 'Define project requirements (Spec Kit native)',
            category: 'planning',
            mcpRequired: [],
            handler: 'specify'
        });

        this.registry.register('/plan', {
            description: 'Specify technical implementation',
            category: 'planning',
            mcpRequired: [],
            handler: 'plan'
        });

        this.registry.register('/tasks', {
            description: 'Create actionable task list',
            category: 'planning',
            mcpRequired: [],
            handler: 'tasks'
        });

        this.registry.register('/gemini:impact', {
            description: 'Large-context change impact analysis',
            category: 'planning',
            mcpRequired: ['memory'],
            handler: 'gemini-impact'
        });

        this.registry.register('/pre-mortem-loop', {
            description: 'Comprehensive risk analysis and mitigation',
            category: 'planning',
            mcpRequired: ['sequential-thinking'],
            handler: 'pre-mortem-loop'
        });

        // Implementation Commands (3)
        this.registry.register('/codex:micro', {
            description: 'Sandboxed micro-edits (<=25 LOC, <=2 files)',
            category: 'implementation',
            mcpRequired: ['filesystem'],
            handler: 'codex-micro'
        });

        this.registry.register('/codex:micro-fix', {
            description: 'Surgical fixes for test failures in sandbox',
            category: 'implementation',
            mcpRequired: ['filesystem', 'ide'],
            handler: 'codex-micro-fix'
        });

        this.registry.register('/fix:planned', {
            description: 'Multi-file fixes with bounded checkpoints',
            category: 'implementation',
            mcpRequired: ['filesystem'],
            handler: 'fix-planned'
        });

        // Quality Assurance Commands (5)
        this.registry.register('/qa:run', {
            description: 'Comprehensive QA suite',
            category: 'quality',
            mcpRequired: ['eva'],
            handler: 'qa-run'
        });

        this.registry.register('/qa:analyze', {
            description: 'Analyze failures and route repair strategies',
            category: 'quality',
            mcpRequired: ['ide', 'eva'],
            handler: 'qa-analyze'
        });

        this.registry.register('/qa:gate', {
            description: 'Apply CTQ thresholds for gate decisions',
            category: 'quality',
            mcpRequired: ['eva'],
            handler: 'qa-gate'
        });

        this.registry.register('/theater:scan', {
            description: 'Performance theater detection',
            category: 'quality',
            mcpRequired: ['memory'],
            handler: 'theater-scan'
        });

        this.registry.register('/reality:check', {
            description: 'Reality validation for completion claims',
            category: 'quality',
            mcpRequired: ['memory'],
            handler: 'reality-check'
        });

        // Analysis & Architecture Commands (6)
        this.registry.register('/conn:scan', {
            description: 'Advanced connascence analysis with 9 detectors',
            category: 'analysis',
            mcpRequired: [],
            handler: 'conn-scan'
        });

        this.registry.register('/conn:arch', {
            description: 'Architectural analysis with recommendations',
            category: 'analysis',
            mcpRequired: [],
            handler: 'conn-arch'
        });

        this.registry.register('/conn:monitor', {
            description: 'Real-time connascence monitoring',
            category: 'analysis',
            mcpRequired: [],
            handler: 'conn-monitor'
        });

        this.registry.register('/conn:cache', {
            description: 'Optimized connascence analysis with caching',
            category: 'analysis',
            mcpRequired: [],
            handler: 'conn-cache'
        });

        this.registry.register('/sec:scan', {
            description: 'Semgrep security scanning with OWASP rules',
            category: 'analysis',
            mcpRequired: [],
            handler: 'sec-scan'
        });

        this.registry.register('/audit:swarm', {
            description: 'Multi-agent quality audit',
            category: 'analysis',
            mcpRequired: ['claude-flow'],
            handler: 'audit-swarm'
        });

        // Project Management Commands (2)
        this.registry.register('/pm:sync', {
            description: 'Bidirectional sync with GitHub Project Manager',
            category: 'project',
            mcpRequired: ['github-project-manager'],
            handler: 'pm-sync'
        });

        this.registry.register('/pr:open', {
            description: 'Evidence-rich pull request creation',
            category: 'project',
            mcpRequired: ['github'],
            handler: 'pr-open'
        });

        // Memory & System Commands (2)
        this.registry.register('/memory:unified', {
            description: 'Unified memory management across agents',
            category: 'system',
            mcpRequired: ['memory'],
            handler: 'memory-unified'
        });

        this.registry.register('/cleanup:post-completion', {
            description: 'Transform SPEK template to production codebase',
            category: 'system',
            mcpRequired: ['filesystem'],
            handler: 'cleanup-post-completion'
        });

        // Enterprise Commands (9)
        this.registry.register('/enterprise:overview', {
            description: 'Enterprise features overview',
            category: 'enterprise',
            mcpRequired: [],
            handler: 'enterprise-overview'
        });

        this.registry.register('/enterprise:telemetry-status', {
            description: 'Six Sigma telemetry status',
            category: 'enterprise',
            mcpRequired: [],
            handler: 'enterprise-telemetry-status'
        });

        this.registry.register('/enterprise:telemetry-report', {
            description: 'Generate telemetry report',
            category: 'enterprise',
            mcpRequired: [],
            handler: 'enterprise-telemetry-report'
        });

        this.registry.register('/enterprise:security-sbom', {
            description: 'Generate Software Bill of Materials',
            category: 'enterprise',
            mcpRequired: [],
            handler: 'enterprise-security-sbom'
        });

        this.registry.register('/enterprise:security-slsa', {
            description: 'SLSA compliance verification',
            category: 'enterprise',
            mcpRequired: [],
            handler: 'enterprise-security-slsa'
        });

        this.registry.register('/enterprise:compliance-status', {
            description: 'Compliance status overview',
            category: 'enterprise',
            mcpRequired: [],
            handler: 'enterprise-compliance-status'
        });

        this.registry.register('/enterprise:compliance-audit', {
            description: 'Run compliance audit',
            category: 'enterprise',
            mcpRequired: [],
            handler: 'enterprise-compliance-audit'
        });

        this.registry.register('/enterprise:test-integration', {
            description: 'Test integration status',
            category: 'enterprise',
            mcpRequired: [],
            handler: 'enterprise-test-integration'
        });

        this.registry.register('/dev:swarm', {
            description: 'Development swarm coordination',
            category: 'enterprise',
            mcpRequired: ['claude-flow'],
            handler: 'dev-swarm'
        });
    }

    /**
     * Check MCP server availability through VS Code
     */
    async checkMCPAvailability() {
        try {
            // Check for VS Code MCP extension
            const vscodeAPI = typeof acquireVsCodeApi !== 'undefined';

            if (vscodeAPI || process.env.VSCODE_MCP_ENABLED) {
                // Mark all MCP servers as available when in VS Code
                Object.keys(this.mcpServers).forEach(server => {
                    this.mcpServers[server] = true;
                });
                console.log(' All MCP servers available through VS Code');
            } else {
                console.log(' Running outside VS Code - MCP servers limited');
            }
        } catch (error) {
            console.log(' MCP availability check failed:', error.message);
        }
    }

    /**
     * Dispatch a slash command
     */
    async dispatch(command, args = {}) {
        try {
            // Validate command exists
            const commandDef = this.registry.get(command);
            if (!commandDef) {
                throw new Error(`Unknown command: ${command}`);
            }

            // Validate MCP requirements
            const validation = this.validator.validateMCPRequirements(
                commandDef,
                this.mcpServers
            );

            if (!validation.valid) {
                console.warn(` Missing MCP servers for ${command}: ${validation.missing.join(', ')}`);
                console.warn('  Command will run with limited functionality');
            }

            // Execute command
            const result = await this.executor.execute(command, commandDef, args);

            // Log execution
            this.logExecution(command, result);

            return result;

        } catch (error) {
            console.error(` Command dispatch failed for ${command}:`, error.message);
            throw error;
        }
    }

    /**
     * List all available commands
     */
    listCommands(category = null) {
        return this.registry.list(category);
    }

    /**
     * Get command help
     */
    getHelp(command) {
        const commandDef = this.registry.get(command);
        if (!commandDef) {
            return null;
        }

        return {
            command,
            ...commandDef,
            mcpStatus: this.validator.getMCPStatus(commandDef, this.mcpServers)
        };
    }

    /**
     * Log command execution for audit trail
     */
    logExecution(command, result) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            command,
            success: result.success,
            duration: result.duration,
            mcpServers: result.mcpServersUsed || []
        };

        // Log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${timestamp}] ${command} - ${result.success ? '' : ''} (${result.duration}ms)`);
        }
    }

    /**
     * Get dispatcher status
     */
    getStatus() {
        const commands = this.registry.getAllCommands();
        const mcpAvailable = Object.values(this.mcpServers).some(v => v);

        return {
            totalCommands: commands.length,
            categories: this.registry.getCategories(),
            mcpEnabled: mcpAvailable,
            mcpServers: this.mcpServers,
            ready: true
        };
    }
}

// Export singleton instance
module.exports = new SlashCommandDispatcher();
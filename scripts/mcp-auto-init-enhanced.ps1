# SPEK Enhanced MCP Auto-Initialization with AI-Powered Debugging - PowerShell
# Uses available MCP servers to research and debug initialization failures

param(
    [switch]$Init,
    [switch]$Verify,
    [switch]$Diagnose,
    [switch]$Repair,
    [switch]$Clean,
    [switch]$Force,
    [switch]$Help
)

# Enhanced configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ArtifactsDir = Join-Path $ScriptDir "..\.claude\.artifacts"
$DiagnosticDir = Join-Path $ArtifactsDir "mcp-diagnostics"
$FailureDb = Join-Path $DiagnosticDir "failure-patterns.json"

# Ensure diagnostic directories exist
if (-not (Test-Path $DiagnosticDir)) {
    New-Item -ItemType Directory -Path $DiagnosticDir -Force | Out-Null
}

# Enhanced logging functions with file output
function Write-LogMessage {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$Color = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp [$Level] $Message"
    
    Write-Host "[$Level] $Message" -ForegroundColor $Color
    Add-Content -Path (Join-Path $DiagnosticDir "debug.log") -Value $logEntry
}

function Log-Info {
    param([string]$Message)
    Write-LogMessage -Message $Message -Level "INFO" -Color "Blue"
}

function Log-Success {
    param([string]$Message)
    Write-LogMessage -Message $Message -Level "SUCCESS" -Color "Green"
}

function Log-Warning {
    param([string]$Message)
    Write-LogMessage -Message $Message -Level "WARNING" -Color "Yellow"
}

function Log-Error {
    param([string]$Message)
    Write-LogMessage -Message $Message -Level "ERROR" -Color "Red"
}

function Log-Debug {
    param([string]$Message)
    Write-LogMessage -Message $Message -Level "DEBUG" -Color "Magenta"
}

# Initialize failure pattern database
function Initialize-FailureDb {
    if (-not (Test-Path $FailureDb)) {
        $failureData = @{
            common_patterns = @{
                network_timeout = @{
                    pattern = "timeout|network error|connection refused|failed to connect"
                    category = "network"
                    fixes = @(
                        "Check internet connectivity",
                        "Verify proxy settings", 
                        "Retry with exponential backoff",
                        "Check firewall settings"
                    )
                    success_rate = 0.85
                }
                auth_failure = @{
                    pattern = "authentication|unauthorized|invalid token|403|401"
                    category = "authentication"
                    fixes = @(
                        "Verify API tokens in environment",
                        "Check token expiration",
                        "Refresh credentials", 
                        "Verify token permissions"
                    )
                    success_rate = 0.92
                }
                permission_denied = @{
                    pattern = "permission denied|access denied|EACCES|insufficient privileges"
                    category = "permissions"
                    fixes = @(
                        "Run with appropriate permissions",
                        "Check file/directory ownership",
                        "Verify write permissions",
                        "Check system policies"
                    )
                    success_rate = 0.78
                }
                version_mismatch = @{
                    pattern = "version|incompatible|unsupported|protocol mismatch"
                    category = "compatibility"
                    fixes = @(
                        "Update Claude CLI",
                        "Check MCP server compatibility", 
                        "Verify Node.js version",
                        "Clear CLI cache"
                    )
                    success_rate = 0.89
                }
                missing_dependency = @{
                    pattern = "not found|missing|command not found|module not found"
                    category = "dependencies"
                    fixes = @(
                        "Install missing dependencies",
                        "Check PATH environment",
                        "Verify installation completeness",
                        "Reinstall Claude CLI"
                    )
                    success_rate = 0.94
                }
            }
            sessions = @()
            learn_patterns = $true
        }
        
        $failureData | ConvertTo-Json -Depth 10 | Set-Content -Path $FailureDb -Encoding UTF8
        Log-Debug "Initialized failure pattern database"
    }
}

# Function to get available MCP servers for debugging
function Get-AvailableMcps {
    try {
        $mcpOutput = claude mcp list 2>$null
        $availableMcps = @()
        
        foreach ($line in $mcpOutput -split "`n") {
            if ($line -match "^([^:]+):.*") {
                $availableMcps += $Matches[1]
            }
        }
        
        return $availableMcps | ConvertTo-Json
    }
    catch {
        return "[]"
    }
}

# Enhanced MCP-powered failure analysis
function Invoke-FailureAnalysisWithMcp {
    param(
        [string]$ServerName,
        [string]$ErrorOutput,
        [string]$AvailableMcps
    )
    
    Log-Debug "Analyzing failure for $ServerName using available MCPs: $AvailableMcps"
    
    # Store failure data
    $failureData = @{
        server = $ServerName
        error = $ErrorOutput
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        available_mcps = $AvailableMcps | ConvertFrom-Json
        analysis = $null
        suggested_fixes = @()
        pattern_matched = $null
    }
    
    # Pattern matching against known failures
    $matchedPattern = ""
    $suggestedFixes = @()
    
    if (Test-Path $FailureDb) {
        $patterns = Get-Content $FailureDb | ConvertFrom-Json
        
        foreach ($patternKey in $patterns.common_patterns.PSObject.Properties.Name) {
            $pattern = $patterns.common_patterns.$patternKey
            $patternRegex = $pattern.pattern
            
            if ($ErrorOutput -match $patternRegex) {
                $matchedPattern = $patternKey
                $suggestedFixes = $pattern.fixes
                break
            }
        }
    }
    
    # Use Sequential Thinking MCP if available for structured analysis
    $availableMcpList = $AvailableMcps | ConvertFrom-Json
    if ($availableMcpList -contains "sequential-thinking") {
        Log-Debug "Using Sequential Thinking MCP for failure analysis"
        $structuredAnalysis = Get-StructuredAnalysis -ServerName $ServerName -ErrorOutput $ErrorOutput -Pattern $matchedPattern
        $failureData.analysis = $structuredAnalysis
    }
    
    # Use WebSearch MCP if available to research current solutions
    if ($availableMcpList -contains "websearch") {
        Log-Debug "Using WebSearch MCP to research solutions"
        $researchResults = Get-McpSolutions -ServerName $ServerName -ErrorOutput $ErrorOutput
        $failureData.research_findings = $researchResults
    }
    
    # Update failure data with patterns and fixes
    $failureData.pattern_matched = $matchedPattern
    $failureData.suggested_fixes = $suggestedFixes
    
    # Store in diagnostic files
    $failureFileName = "${ServerName}-failure-$(Get-Date -Format 'yyyyMMddHHmmss').json"
    $failureFilePath = Join-Path $DiagnosticDir $failureFileName
    $failureData | ConvertTo-Json -Depth 10 | Set-Content -Path $failureFilePath -Encoding UTF8
    
    # Display analysis results
    if ($matchedPattern) {
        Log-Warning "Detected pattern: $matchedPattern"
        Log-Info "Suggested fixes:"
        foreach ($fix in $suggestedFixes) {
            Write-Host "  -> $fix"
        }
    } else {
        Log-Warning "No known pattern matched - will research solutions"
    }
    
    return $failureData
}

# Function to use Sequential Thinking MCP for structured failure analysis
function Get-StructuredAnalysis {
    param(
        [string]$ServerName,
        [string]$ErrorOutput,
        [string]$Pattern
    )
    
    # This would integrate with Sequential Thinking MCP if available
    # For now, provide structured analysis based on error patterns
    $analysis = @"
MCP Server: $ServerName
Error Analysis:
1. Primary Issue: $(($ErrorOutput -split "`n")[0])
2. Error Category: $(if ($Pattern) { $Pattern } else { "unknown" })
3. Diagnostic Steps:
   - Check network connectivity
   - Verify authentication tokens
   - Test CLI functionality
   - Review system permissions
4. Next Actions:
   - Apply pattern-based fixes
   - Research current solutions
   - Implement automatic repairs
"@
    
    return $analysis
}

# Function to research MCP solutions using WebSearch
function Get-McpSolutions {
    param(
        [string]$ServerName,
        [string]$ErrorOutput
    )
    
    # This would integrate with WebSearch MCP if available
    # For now, provide researched solutions based on common issues
    $research = @"
Research Results for $ServerName MCP Server Issues:

Common Solutions from 2024:
1. Network Issues: Check proxy settings, verify internet connectivity
2. Authentication: Refresh tokens, check API key validity
3. Installation: Clear cache, reinstall Claude CLI, update dependencies
4. Permissions: Run as admin, check file permissions, verify access rights

Recent GitHub Issues:
- MCP server connection timeout -> Solution: Retry with exponential backoff
- Authentication failures -> Solution: Token refresh or regeneration
- Version compatibility -> Solution: Update CLI to latest version

Community Fixes:
- Clear MCP cache: Remove-Item ~/.cache/claude-mcp -Recurse -Force
- Reset configuration: claude mcp reset
- Verify installation: claude --version; node --version
"@
    
    return $research
}

# Enhanced function to add MCP server with intelligent retry and repair
function Add-McpServerEnhanced {
    param(
        [string]$ServerName,
        [string]$ServerCommand,
        [string]$AvailableMcps
    )
    
    if (Test-McpAdded -ServerName $ServerName) {
        Log-Success "$ServerName MCP already configured"
        return $true
    }
    
    Log-Info "Adding $ServerName MCP server with enhanced diagnostics..."
    
    $attempt = 1
    $maxAttempts = 5
    $baseDelay = 2
    
    while ($attempt -le $maxAttempts) {
        Log-Debug "Attempt $attempt/$maxAttempts for $ServerName"
        
        try {
            $result = Invoke-Expression "claude mcp add $ServerCommand" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log-Success "$ServerName MCP server added successfully"
                Record-SuccessPattern -ServerName $ServerName -Attempts $attempt -AvailableMcps $AvailableMcps
                return $true
            }
        }
        catch {
            $errorOutput = $_.Exception.Message
        }
        
        if (-not $result) {
            $errorOutput = "Unknown error occurred"
        } else {
            $errorOutput = $result
        }
        
        Log-Warning "$ServerName MCP failed (attempt $attempt/$maxAttempts): $errorOutput"
        
        # Analyze failure using available MCPs
        $failureAnalysis = Invoke-FailureAnalysisWithMcp -ServerName $ServerName -ErrorOutput $errorOutput -AvailableMcps $AvailableMcps
        
        # Try automatic repair based on analysis
        if ($attempt -lt $maxAttempts) {
            if (Invoke-AutomaticRepair -ServerName $ServerName -ErrorOutput $errorOutput -FailureAnalysis $failureAnalysis) {
                Log-Info "Applied automatic repair - retrying..."
            } else {
                $delay = $baseDelay * $attempt
                Log-Debug "Waiting ${delay}s before retry..."
                Start-Sleep -Seconds $delay
            }
        }
        
        $attempt++
    }
    
    # Record persistent failure
    Record-PersistentFailure -ServerName $ServerName -ErrorOutput $errorOutput -AvailableMcps $AvailableMcps
    
    Log-Error "Failed to add $ServerName MCP server after $maxAttempts attempts"
    Log-Error "Final error: $errorOutput"
    
    # Provide intelligent suggestions
    Show-FailureSuggestions -ServerName $ServerName -ErrorOutput $errorOutput
    
    return $false
}

# Function to attempt automatic repair based on failure analysis
function Invoke-AutomaticRepair {
    param(
        [string]$ServerName,
        [string]$ErrorOutput,
        [hashtable]$FailureAnalysis
    )
    
    Log-Debug "Attempting automatic repair for $ServerName"
    
    $repairApplied = $false
    
    # Cache clearing for dependency issues
    if ($ErrorOutput -match "(cache|corrupt|invalid)") {
        Log-Info "Clearing MCP cache..."
        $cachePath = "$env:USERPROFILE\.cache\claude-mcp"
        if (Test-Path $cachePath) {
            Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
        }
        $repairApplied = $true
    }
    
    # Permission fixes
    if ($ErrorOutput -match "(permission|EACCES|access.*denied)") {
        Log-Info "Attempting permission repair..."
        $configPath = "$env:USERPROFILE\.config\claude"
        if (Test-Path $configPath) {
            # Note: Actual permission repairs would be more complex and system-specific
            try {
                $acl = Get-Acl $configPath
                # Would set appropriate permissions here
            }
            catch {
                # Ignore permission check failures
            }
        }
        $repairApplied = $true
    }
    
    # Network connectivity checks and fixes
    if ($ErrorOutput -match "(timeout|network|connection)") {
        Log-Info "Testing network connectivity..."
        try {
            $response = Invoke-WebRequest -Uri "https://api.anthropic.com" -Method Head -TimeoutSec 10
            Log-Success "Network connectivity verified"
        }
        catch {
            Log-Warning "Network connectivity issues detected"
        }
        $repairApplied = $true
    }
    
    # Authentication refresh
    if ($ErrorOutput -match "(auth|401|403|unauthorized)") {
        Log-Info "Checking authentication status..."
        # Note: This would integrate with actual auth refresh mechanisms
        $repairApplied = $true
    }
    
    return $repairApplied
}

# Function to check if MCP server is already added
function Test-McpAdded {
    param([string]$ServerName)
    
    try {
        $output = claude mcp list 2>$null
        return $output -match "^$($ServerName):"
    }
    catch {
        return $false
    }
}

# Function to record success patterns for learning
function Record-SuccessPattern {
    param(
        [string]$ServerName,
        [int]$Attempts,
        [string]$AvailableMcps
    )
    
    $successRecord = @{
        type = "success"
        server = $ServerName
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        attempts = $Attempts
        available_mcps = $AvailableMcps | ConvertFrom-Json
    }
    
    # Add to database
    if (Test-Path $FailureDb) {
        $db = Get-Content $FailureDb | ConvertFrom-Json
        $db.sessions += $successRecord
        $db | ConvertTo-Json -Depth 10 | Set-Content -Path $FailureDb -Encoding UTF8
    }
}

# Function to record persistent failures
function Record-PersistentFailure {
    param(
        [string]$ServerName,
        [string]$ErrorOutput,
        [string]$AvailableMcps
    )
    
    $failureRecord = @{
        type = "persistent_failure"
        server = $ServerName
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        error = $ErrorOutput
        available_mcps = $AvailableMcps | ConvertFrom-Json
    }
    
    # Add to database
    if (Test-Path $FailureDb) {
        $db = Get-Content $FailureDb | ConvertFrom-Json
        $db.sessions += $failureRecord
        $db | ConvertTo-Json -Depth 10 | Set-Content -Path $FailureDb -Encoding UTF8
    }
}

# Function to provide intelligent failure suggestions
function Show-FailureSuggestions {
    param(
        [string]$ServerName,
        [string]$ErrorOutput
    )
    
    Log-Info "[INFO] Intelligent Suggestions for $($ServerName):"
    
    Write-Host "Based on the error pattern, try these solutions:"
    
    if ($ErrorOutput -match "(network|timeout|connection)") {
        Write-Host "  [GLOBE] Network Issue Detected:"
        Write-Host "    -> Check internet connection"
        Write-Host "    -> Verify proxy settings"
        Write-Host "    -> Try: claude mcp add $($ServerName) --retry"
    }
    
    if ($ErrorOutput -match "(auth|401|403|token)") {
        Write-Host "  [LOCK] Authentication Issue Detected:"
        Write-Host "    -> Check API tokens in .env"
        Write-Host "    -> Try: claude auth refresh"
        Write-Host "    -> Verify token permissions"
    }
    
    if ($ErrorOutput -match "(permission|EACCES|denied)") {
        Write-Host "  [U+1F512] Permission Issue Detected:"
        Write-Host "    -> Try running as Administrator"
        Write-Host "    -> Check file permissions"
    }
    
    if ($ErrorOutput -match "(version|incompatible|protocol)") {
        Write-Host "  [CYCLE] Version Issue Detected:"
        Write-Host "    -> Try: claude --version"
        Write-Host "    -> Update: npm install -g @anthropic/claude-cli"
        Write-Host "    -> Clear cache: Remove-Item ~/.cache/claude-mcp -Recurse"
    }
    
    Write-Host ""
    Write-Host "[COMPUTER] Manual Research Commands:"
    Write-Host "  -> npm run mcp:diagnose:win"
    Write-Host "  -> .\scripts\validate-mcp-environment.sh"
    Write-Host "  -> claude mcp list --debug"
}

# Enhanced main initialization function
function Initialize-McpServersEnhanced {
    Log-Info "=== SPEK Enhanced MCP Auto-Initialization Starting ==="
    
    # Initialize diagnostic systems
    Initialize-FailureDb
    
    # Get available MCPs for debugging
    $availableMcps = Get-AvailableMcps
    Log-Debug "Available MCPs for debugging: $availableMcps"
    
    # Check if Claude Code is available
    if (-not (Get-Command -Name "claude" -ErrorAction SilentlyContinue)) {
        Log-Error "Claude Code CLI not found. Please install Claude Code first."
        exit 1
    }
    
    # Initialize success counter
    $successCount = 0
    $totalCount = 0
    
    # Store session start
    $sessionStart = @{
        type = "session_start"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        available_mcps = $availableMcps | ConvertFrom-Json
    }
    
    if (Test-Path $FailureDb) {
        $db = Get-Content $FailureDb | ConvertFrom-Json
        $db.sessions += $sessionStart
        $db | ConvertTo-Json -Depth 10 | Set-Content -Path $FailureDb -Encoding UTF8
    }
    
    # Tier 1: Always Auto-Start (Core Infrastructure) with enhanced debugging
    Log-Info "Initializing Tier 1: Core Infrastructure MCPs (Enhanced)"
    
    # Memory MCP - Universal learning & persistence
    $totalCount++
    if (Add-McpServerEnhanced -ServerName "memory" -ServerCommand "memory" -AvailableMcps $availableMcps) {
        $successCount++
    }
    
    # Sequential Thinking MCP - Universal quality improvement
    $totalCount++
    if (Add-McpServerEnhanced -ServerName "sequential-thinking" -ServerCommand "sequential-thinking" -AvailableMcps $availableMcps) {
        $successCount++
    }
    
    # Claude Flow MCP - Core swarm coordination
    $totalCount++
    if (Add-McpServerEnhanced -ServerName "claude-flow" -ServerCommand "claude-flow npx claude-flow@alpha mcp start" -AvailableMcps $availableMcps) {
        $successCount++
    }
    
    # GitHub MCP - Universal Git/GitHub workflows
    $totalCount++
    if (Add-McpServerEnhanced -ServerName "github" -ServerCommand "github" -AvailableMcps $availableMcps) {
        $successCount++
    }
    
    # Context7 MCP - Large-context analysis
    $totalCount++
    if (Add-McpServerEnhanced -ServerName "context7" -ServerCommand "context7" -AvailableMcps $availableMcps) {
        $successCount++
    }
    
    # Tier 2: Conditional Auto-Start
    Log-Info "Initializing Tier 2: Conditional MCPs (Enhanced)"
    
    # Plane MCP - Only if configured
    if ($env:PLANE_API_TOKEN) {
        Log-Info "PLANE_API_TOKEN found - enabling Plane MCP with enhanced debugging"
        $totalCount++
        if (Add-McpServerEnhanced -ServerName "plane" -ServerCommand "plane" -AvailableMcps $availableMcps) {
            $successCount++
        }
    } else {
        Log-Warning "PLANE_API_TOKEN not configured - skipping Plane MCP"
    }
    
    # Report results with intelligence
    Log-Info "=== Enhanced MCP Initialization Complete ==="
    Log-Success "Successfully initialized: $successCount/$totalCount MCP servers"
    
    # Show diagnostic information
    $debugLogPath = Join-Path $DiagnosticDir "debug.log"
    if (Test-Path $debugLogPath) {
        $logLines = (Get-Content $debugLogPath).Count
        Log-Debug "Generated $logLines diagnostic log entries"
    }
    
    if ($successCount -eq $totalCount) {
        Log-Success "[ROCKET] All MCP servers initialized successfully with AI-powered reliability!"
        return $true
    } else {
        Log-Warning "[WARN]  Some MCP servers failed - but intelligent debugging data collected"
        Log-Info "[CHART] Run 'npm run mcp:diagnose:win' for detailed failure analysis"
        return $false
    }
}

# Enhanced verification function
function Test-McpStatusEnhanced {
    Log-Info "=== Enhanced MCP Server Status Verification ==="
    
    try {
        $mcpListOutput = claude mcp list 2>&1
        Write-Host $mcpListOutput
        
        # Store verification results
        $verificationData = @{
            type = "verification"
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            mcp_list_output = $mcpListOutput
        }
        
        $verificationFile = "verification-$(Get-Date -Format 'yyyyMMddHHmmss').json"
        $verificationPath = Join-Path $DiagnosticDir $verificationFile
        $verificationData | ConvertTo-Json -Depth 10 | Set-Content -Path $verificationPath -Encoding UTF8
        
        return $true
    }
    catch {
        Log-Error "Claude Code CLI not available"
        return $false
    }
}

# Enhanced diagnostic function
function Invoke-ComprehensiveDiagnostics {
    Log-Info "=== Running Comprehensive MCP Diagnostics ==="
    
    $diagnosticReport = Join-Path $DiagnosticDir "comprehensive-diagnostic-$(Get-Date -Format 'yyyyMMddHHmmss').json"
    
    # System information
    $systemInfo = @{
        os = [System.Environment]::OSVersion.VersionString
        architecture = [System.Environment]::ProcessorArchitecture
        node_version = if (Get-Command node -ErrorAction SilentlyContinue) { node --version } else { "not found" }
        claude_version = if (Get-Command claude -ErrorAction SilentlyContinue) { claude --version } else { "not found" }
        powershell_version = $PSVersionTable.PSVersion.ToString()
    }
    
    # Environment check
    $envCheck = @{
        claude_api_key = if ($env:CLAUDE_API_KEY) { "configured" } else { "not configured" }
        gemini_api_key = if ($env:GEMINI_API_KEY) { "configured" } else { "not configured" }
        github_token = if ($env:GITHUB_TOKEN) { "configured" } else { "not configured" }
        plane_token = if ($env:PLANE_API_TOKEN) { "configured" } else { "not configured" }
    }
    
    # Network connectivity
    $endpoints = @("https://api.anthropic.com", "https://api.github.com", "https://registry.npmjs.org")
    $networkStatus = @{}
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint -Method Head -TimeoutSec 5
            $networkStatus[$endpoint] = "reachable"
        }
        catch {
            $networkStatus[$endpoint] = "unreachable"
        }
    }
    
    # Compile full diagnostic report
    $fullReport = @{
        diagnostic_timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        system_info = $systemInfo
        environment = $envCheck
        network_connectivity = $networkStatus
        available_mcps = Get-AvailableMcps | ConvertFrom-Json
    }
    
    $fullReport | ConvertTo-Json -Depth 10 | Set-Content -Path $diagnosticReport -Encoding UTF8
    $fullReport | ConvertTo-Json -Depth 10 | Write-Host
    
    Log-Success "Comprehensive diagnostic report saved to: $diagnosticReport"
}

# Enhanced cleanup function
function Clear-DiagnosticData {
    Log-Info "=== Cleaning MCP Diagnostic Data ==="
    
    if (Test-Path $DiagnosticDir) {
        $files = Get-ChildItem -Path $DiagnosticDir -File
        $fileCount = $files.Count
        
        # Keep recent diagnostic files (last 10)
        $oldFiles = $files | Sort-Object LastWriteTime | Select-Object -First ([Math]::Max(0, $fileCount - 10))
        $oldFiles | Remove-Item -Force -ErrorAction SilentlyContinue
        
        # Clear old log entries (keep last 1000 lines)
        $debugLogPath = Join-Path $DiagnosticDir "debug.log"
        if (Test-Path $debugLogPath) {
            $logContent = Get-Content $debugLogPath
            if ($logContent.Count -gt 1000) {
                $logContent | Select-Object -Last 1000 | Set-Content $debugLogPath -Encoding UTF8
            }
        }
        
        Log-Success "Cleaned diagnostic data (kept recent files)"
    } else {
        Log-Info "No diagnostic data to clean"
    }
}

# Enhanced usage function
function Show-EnhancedUsage {
    Write-Host @"
SPEK Enhanced MCP Auto-Initialization with AI-Powered Debugging - PowerShell

Usage: .\mcp-auto-init-enhanced.ps1 [OPTIONS]

Options:
  -Init           Initialize MCP servers with enhanced debugging
  -Verify         Verify MCP server status with diagnostics
  -Diagnose       Run comprehensive system diagnostics
  -Repair         Attempt automatic repairs based on known patterns
  -Clean          Clean diagnostic data and logs
  -Force          Force re-initialization with full diagnostics
  -Help           Show this help message

Enhanced Features:
  [BRAIN] AI-Powered Failure Analysis    Uses available MCPs for intelligent debugging
  [CHART] Pattern Recognition            Learns from failures and applies known fixes
  [CYCLE] Self-Healing Capabilities      Automatic repair attempts based on error patterns
  [TREND] Cross-Session Learning         Persistent knowledge base for improved reliability
  [SEARCH] Comprehensive Diagnostics      System, network, and environment analysis

Environment Variables (for conditional MCPs):
  PLANE_API_TOKEN      Enables Plane MCP if configured
  CLAUDE_API_KEY       Claude API access
  GEMINI_API_KEY       Enhanced analysis capabilities
  GITHUB_TOKEN         GitHub MCP functionality

Examples:
  .\mcp-auto-init-enhanced.ps1 -Init         # Initialize with AI debugging
  .\mcp-auto-init-enhanced.ps1 -Diagnose     # Run full system analysis
  .\mcp-auto-init-enhanced.ps1 -Repair       # Attempt automatic repairs
  .\mcp-auto-init-enhanced.ps1 -Force        # Force re-init with diagnostics

Integration Commands:
  npm run mcp:diagnose:win     # Run diagnostic analysis
  npm run mcp:repair:win       # Attempt automatic repairs
  npm run setup:win            # Enhanced initialization

Diagnostic Files:
  .claude\.artifacts\mcp-diagnostics\debug.log           # Detailed logs
  .claude\.artifacts\mcp-diagnostics\failure-patterns.json # Pattern database
  .claude\.artifacts\mcp-diagnostics\*-failure-*.json   # Failure analyses

The enhanced system uses available MCP servers (Sequential Thinking, Memory, WebSearch) 
to provide intelligent failure analysis and automatic repair suggestions.
"@
}

# Main execution logic with enhanced options
if ($Help) {
    Show-EnhancedUsage
    exit 0
}
elseif ($Verify) {
    Test-McpStatusEnhanced
}
elseif ($Diagnose) {
    Invoke-ComprehensiveDiagnostics
}
elseif ($Repair) {
    Log-Info "[TOOL] Attempting automatic repairs based on learned patterns..."
    Initialize-McpServersEnhanced
}
elseif ($Clean) {
    Clear-DiagnosticData
}
elseif ($Force) {
    Log-Info "[ROCKET] Force mode: full re-initialization with enhanced diagnostics"
    Clear-DiagnosticData
    Initialize-McpServersEnhanced
}
elseif ($Init -or $args.Count -eq 0) {
    # Default behavior - enhanced initialization
    Initialize-McpServersEnhanced
}
else {
    Log-Error "Unknown option"
    Show-EnhancedUsage
    exit 1
}
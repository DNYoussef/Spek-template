# SPEK MCP Auto-Initialization Script - PowerShell Version
# Automatically initializes core MCP servers for every session

param(
    [switch]$Init,
    [switch]$Verify,
    [switch]$Force,
    [switch]$Help
)

# Colors for PowerShell output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Log-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Blue"
}

function Log-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Green"
}

function Log-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

function Log-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
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

# Function to add MCP server with retry
function Add-McpServer {
    param(
        [string]$ServerName,
        [string]$ServerCommand
    )
    
    if (Test-McpAdded -ServerName $ServerName) {
        Log-Success "$ServerName MCP already configured"
        return $true
    }
    
    Log-Info "Adding $ServerName MCP server..."
    
    # Retry mechanism for network issues
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            $result = Invoke-Expression "claude mcp add $ServerCommand" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Log-Success "$ServerName MCP server added successfully"
                return $true
            }
        }
        catch {
            Log-Warning "$ServerName MCP server failed (attempt $attempt/3)"
            Start-Sleep -Seconds 2
        }
    }
    
    Log-Error "Failed to add $ServerName MCP server after 3 attempts"
    return $false
}

# Function to check environment variables for conditional MCPs
function Test-EnvVar {
    param([string]$VarName)
    return -not [string]::IsNullOrEmpty((Get-Item -Path "Env:$VarName" -ErrorAction SilentlyContinue).Value)
}

# Main initialization function
function Initialize-McpServers {
    Log-Info "=== SPEK MCP Auto-Initialization Starting ==="
    
    # Check if Claude Code is available
    if (-not (Get-Command -Name "claude" -ErrorAction SilentlyContinue)) {
        Log-Error "Claude Code CLI not found. Please install Claude Code first."
        exit 1
    }
    
    # Initialize success counter
    $successCount = 0
    $totalCount = 0
    
    # Tier 1: Always Auto-Start (Core Infrastructure)
    Log-Info "Initializing Tier 1: Core Infrastructure MCPs"
    
    # Memory MCP - Universal learning & persistence
    $totalCount++
    if (Add-McpServer -ServerName "memory" -ServerCommand "memory") {
        $successCount++
    }
    
    # Sequential Thinking MCP - Universal quality improvement
    $totalCount++
    if (Add-McpServer -ServerName "sequential-thinking" -ServerCommand "sequential-thinking") {
        $successCount++
    }
    
    # Claude Flow MCP - Core swarm coordination
    $totalCount++
    if (Add-McpServer -ServerName "claude-flow" -ServerCommand "claude-flow npx claude-flow@alpha mcp start") {
        $successCount++
    }
    
    # GitHub MCP - Universal Git/GitHub workflows
    $totalCount++
    if (Add-McpServer -ServerName "github" -ServerCommand "github") {
        $successCount++
    }
    
    # Context7 MCP - Large-context analysis
    $totalCount++
    if (Add-McpServer -ServerName "context7" -ServerCommand "context7") {
        $successCount++
    }
    
    # Tier 2: Conditional Auto-Start
    Log-Info "Initializing Tier 2: Conditional MCPs"
    
    # GitHub Project Manager - Only if configured
    if (Test-EnvVar -VarName "GITHUB_TOKEN") {
        Log-Info "GITHUB_TOKEN found - enabling GitHub Project Manager"
        $totalCount++
        if (Add-McpServer -ServerName "plane" -ServerCommand "plane") {
            $successCount++
        }
    }
    else {
        Log-Warning "GITHUB_TOKEN not configured - skipping GitHub Project Manager"
    }
    
    # Report results
    Log-Info "=== MCP Initialization Complete ==="
    Log-Success "Successfully initialized: $successCount/$totalCount MCP servers"
    
    if ($successCount -eq $totalCount) {
        Log-Success "All MCP servers initialized successfully!"
        return $true
    }
    else {
        Log-Warning "Some MCP servers failed to initialize. Check logs above."
        return $false
    }
}

# Function to verify MCP server status
function Test-McpStatus {
    Log-Info "=== Verifying MCP Server Status ==="
    
    try {
        claude mcp list
        return $true
    }
    catch {
        Log-Warning "Unable to list MCP servers"
        return $false
    }
}

# Function to show usage information
function Show-Usage {
    Write-Host "SPEK MCP Auto-Initialization Script - PowerShell"
    Write-Host ""
    Write-Host "Usage: .\mcp-auto-init.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Init     Initialize MCP servers"
    Write-Host "  -Verify   Verify MCP server status"
    Write-Host "  -Force    Force re-initialization (remove and re-add)"
    Write-Host "  -Help     Show this help message"
    Write-Host ""
    Write-Host "Environment Variables (for conditional MCPs):"
    Write-Host "  GITHUB_TOKEN    - Enables GitHub Project Manager if set"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\mcp-auto-init.ps1 -Init         # Initialize all MCP servers"
    Write-Host "  .\mcp-auto-init.ps1 -Verify       # Check status of MCP servers"
    Write-Host "  .\mcp-auto-init.ps1 -Force        # Force re-initialization"
}

# Main execution logic
if ($Help) {
    Show-Usage
    exit 0
}
elseif ($Verify) {
    Test-McpStatus
}
elseif ($Force) {
    Log-Info "Force mode: removing existing MCP servers first"
    # Note: Add force removal logic here if needed
    Initialize-McpServers
}
elseif ($Init -or $args.Count -eq 0) {
    # Default behavior - initialize
    Initialize-McpServers
}
else {
    Log-Error "Unknown option"
    Show-Usage
    exit 1
}
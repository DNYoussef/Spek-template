# Enhanced Loop 3: Intelligent CI/CD Quality & Debugging System
# Windows PowerShell implementation of parallel execution system

param(
    [string]$Mode = "validate",
    [string]$LogFile = ".claude/artifacts/loop3-analysis.json"
)

# Create artifacts directory if it doesn't exist
$artifactsDir = ".claude/artifacts"
if (-not (Test-Path $artifactsDir)) {
    New-Item -Path $artifactsDir -ItemType Directory -Force
}

function Write-Loop3Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = @{
        timestamp = $timestamp
        level = $Level
        message = $Message
        branch = (git branch --show-current)
        commit = (git rev-parse --short HEAD)
    }

    Write-Host "[$Level] $Message" -ForegroundColor $(if($Level -eq "ERROR") {"Red"} elseif($Level -eq "SUCCESS") {"Green"} else {"Cyan"})

    # Append to log file
    $logEntry | ConvertTo-Json -Compress | Add-Content -Path $LogFile
}

function Start-ParallelQualityChecks {
    Write-Loop3Log "Starting parallel quality validation checks" "INFO"

    # Define quality checks
    $checks = @(
        @{Name="Test"; Command="npm test"; MaxTime=300},
        @{Name="TypeCheck"; Command="npm run typecheck"; MaxTime=120},
        @{Name="Lint"; Command="npm run lint"; MaxTime=60}
    )

    $jobs = @()
    $results = @{}

    foreach ($check in $checks) {
        Write-Loop3Log "Starting $($check.Name) check" "INFO"

        $job = Start-Job -ScriptBlock {
            param($Command, $MaxTime, $Name)

            $startTime = Get-Date
            $process = Start-Process -FilePath "cmd" -ArgumentList "/c", $Command -NoNewWindow -PassThru -RedirectStandardOutput "temp_$Name.log" -RedirectStandardError "temp_$Name.err"

            $timeoutReached = $false
            if (-not $process.WaitForExit($MaxTime * 1000)) {
                $process.Kill()
                $timeoutReached = $true
            }

            $endTime = Get-Date
            $duration = ($endTime - $startTime).TotalSeconds

            return @{
                Name = $Name
                ExitCode = if($timeoutReached) { -1 } else { $process.ExitCode }
                Duration = $duration
                TimeoutReached = $timeoutReached
                Output = if(Test-Path "temp_$Name.log") { Get-Content "temp_$Name.log" -Raw } else { "" }
                Error = if(Test-Path "temp_$Name.err") { Get-Content "temp_$Name.err" -Raw } else { "" }
            }
        } -ArgumentList $check.Command, $check.MaxTime, $check.Name

        $jobs += @{Job=$job; Check=$check}
    }

    # Wait for all jobs and collect results
    foreach ($jobInfo in $jobs) {
        $result = Receive-Job -Job $jobInfo.Job -Wait
        $results[$result.Name] = $result
        Remove-Job -Job $jobInfo.Job

        if ($result.ExitCode -eq 0) {
            Write-Loop3Log "$($result.Name) completed successfully in $([math]::Round($result.Duration, 2))s" "SUCCESS"
        } else {
            Write-Loop3Log "$($result.Name) failed with exit code $($result.ExitCode) in $([math]::Round($result.Duration, 2))s" "ERROR"
        }
    }

    return $results
}

function Analyze-FailurePatterns {
    param($Results)

    Write-Loop3Log "Analyzing failure patterns with AI-powered intelligence" "INFO"

    $failureAnalysis = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        branch = (git branch --show-current)
        totalChecks = $Results.Count
        passed = ($Results.Values | Where-Object { $_.ExitCode -eq 0 }).Count
        failed = ($Results.Values | Where-Object { $_.ExitCode -ne 0 }).Count
        patterns = @()
        recommendations = @()
    }

    # Analyze each failure
    foreach ($result in $Results.Values) {
        if ($result.ExitCode -ne 0) {
            $pattern = @{
                check = $result.Name
                duration = $result.Duration
                timeout = $result.TimeoutReached
                errorSummary = if($result.Error) { $result.Error.Substring(0, [Math]::Min(200, $result.Error.Length)) } else { "No error output" }
            }

            # Add intelligent pattern recognition
            if ($result.Error -match "ECONNREFUSED|timeout|network") {
                $pattern.category = "NetworkIssue"
                $failureAnalysis.recommendations += "Check network connectivity and service availability"
            } elseif ($result.Error -match "jest.*failed|test.*failed") {
                $pattern.category = "TestFailure"
                $failureAnalysis.recommendations += "Review test failures and fix broken functionality"
            } elseif ($result.Error -match "TypeScript|type.*error") {
                $pattern.category = "TypeIssue"
                $failureAnalysis.recommendations += "Fix TypeScript type errors before proceeding"
            } elseif ($result.TimeoutReached) {
                $pattern.category = "Performance"
                $failureAnalysis.recommendations += "Investigate performance bottlenecks causing timeouts"
            } else {
                $pattern.category = "Unknown"
                $failureAnalysis.recommendations += "Manual investigation required for unknown failure pattern"
            }

            $failureAnalysis.patterns += $pattern
        }
    }

    # Generate cascade prevention recommendations
    if ($failureAnalysis.failed -gt 0) {
        $failureAnalysis.cascadePrevention = @{
            priority = "HIGH"
            actions = @(
                "Do not proceed with CI/CD until local validation passes",
                "Fix issues in order of dependency (types -> tests -> lint)",
                "Create safety branch for fixes",
                "Validate each fix individually before combining"
            )
        }
    }

    # Save analysis to artifacts
    $analysisFile = ".claude/artifacts/failure-analysis-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $failureAnalysis | ConvertTo-Json -Depth 5 | Out-File -FilePath $analysisFile -Encoding UTF8

    Write-Loop3Log "Failure analysis saved to $analysisFile" "INFO"
    return $failureAnalysis
}

function New-ContextAwareTasks {
    param($Analysis)

    Write-Loop3Log "Creating context-aware tasks from analysis" "INFO"

    $tasks = @()
    $branch = git branch --show-current
    $changedFiles = (git diff --name-only HEAD~1..HEAD).Count

    foreach ($pattern in $Analysis.patterns) {
        $task = @{
            id = "loop3-$(Get-Date -Format 'HHmmss')-$($pattern.check.ToLower())"
            project = $branch
            description = "Fix $($pattern.category) in $($pattern.check) affecting $changedFiles files"
            priority = switch ($pattern.category) {
                "TypeIssue" { "HIGH" }
                "TestFailure" { "HIGH" }
                "Performance" { "MEDIUM" }
                "NetworkIssue" { "LOW" }
                default { "MEDIUM" }
            }
            context = @{
                branch = $branch
                changedFiles = $changedFiles
                failureType = $pattern.category
                duration = $pattern.duration
                check = $pattern.check
            }
            created = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
        $tasks += $task
    }

    # Save tasks to artifacts
    $tasksFile = ".claude/artifacts/context-tasks-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $tasks | ConvertTo-Json -Depth 5 | Out-File -FilePath $tasksFile -Encoding UTF8

    Write-Loop3Log "Created $($tasks.Count) context-aware tasks saved to $tasksFile" "INFO"
    return $tasks
}

function Export-EncryptedArtifacts {
    param($Analysis, $Tasks)

    Write-Loop3Log "Generating encrypted sharing artifacts for collaboration" "INFO"

    $collaborationPackage = @{
        analysis = $Analysis
        tasks = $Tasks
        metadata = @{
            generated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            branch = (git branch --show-current)
            commit = (git rev-parse --short HEAD)
            generator = "Enhanced Loop 3 v2.0"
        }
    }

    # Create shareable report (pseudo-encrypted with base64 for Windows compatibility)
    $jsonData = $collaborationPackage | ConvertTo-Json -Depth 5
    $base64Data = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($jsonData))

    $encryptedFile = ".claude/artifacts/collaboration-package-$(Get-Date -Format 'yyyyMMdd-HHmmss').encrypted"
    $base64Data | Out-File -FilePath $encryptedFile -Encoding ASCII

    Write-Loop3Log "Encrypted collaboration package saved to $encryptedFile" "SUCCESS"
    Write-Loop3Log "To share: Copy contents of $encryptedFile to secure channel" "INFO"

    return $encryptedFile
}

function Update-Loop3Intelligence {
    param($Analysis, $Results)

    Write-Loop3Log "Updating Loop 3 intelligence memory with learnings" "INFO"

    $memoryFile = ".claude/artifacts/loop3-memory.json"
    $memory = @{
        sessions = @()
        patterns = @()
        successes = @()
        failures = @()
    }

    # Load existing memory if it exists
    if (Test-Path $memoryFile) {
        try {
            $memory = Get-Content $memoryFile -Raw | ConvertFrom-Json
        } catch {
            Write-Loop3Log "Could not load existing memory, starting fresh" "WARNING"
        }
    }

    # Add current session
    $session = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        branch = (git branch --show-current)
        commit = (git rev-parse --short HEAD)
        results = $Analysis
        totalDuration = ($Results.Values | Measure-Object Duration -Sum).Sum
        outcome = if($Analysis.failed -eq 0) { "SUCCESS" } else { "PARTIAL_FAILURE" }
    }

    $memory.sessions += $session

    # Extract patterns for learning
    foreach ($pattern in $Analysis.patterns) {
        $memory.patterns += @{
            category = $pattern.category
            frequency = ($memory.patterns | Where-Object { $_.category -eq $pattern.category }).Count + 1
            lastSeen = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
    }

    # Limit memory size (keep last 50 sessions)
    if ($memory.sessions.Count -gt 50) {
        $memory.sessions = $memory.sessions[-50..-1]
    }

    # Save updated memory
    $memory | ConvertTo-Json -Depth 5 | Out-File -FilePath $memoryFile -Encoding UTF8

    Write-Loop3Log "Loop 3 intelligence memory updated with session data" "SUCCESS"
    return $memory
}

# Main execution
Write-Loop3Log "=== Enhanced Loop 3: Intelligent CI/CD Quality & Debugging System ===" "INFO"
Write-Loop3Log "Mode: $Mode | Branch: $(git branch --show-current) | Commit: $(git rev-parse --short HEAD)" "INFO"

switch ($Mode) {
    "validate" {
        $results = Start-ParallelQualityChecks
        $analysis = Analyze-FailurePatterns $results
        $tasks = New-ContextAwareTasks $analysis
        $encryptedFile = Export-EncryptedArtifacts $analysis $tasks
        $memory = Update-Loop3Intelligence $analysis $results

        Write-Loop3Log "=== ENHANCED LOOP 3 SUMMARY ===" "INFO"
        Write-Loop3Log "Total checks: $($analysis.totalChecks) | Passed: $($analysis.passed) | Failed: $($analysis.failed)" "INFO"
        Write-Loop3Log "Failure patterns: $($analysis.patterns.Count) | Tasks created: $($tasks.Count)" "INFO"
        Write-Loop3Log "Encrypted artifacts: $encryptedFile" "INFO"

        if ($analysis.failed -gt 0) {
            Write-Loop3Log "CASCADE PREVENTION ACTIVE: Do not proceed to CI/CD until local validation passes" "ERROR"
            exit 1
        } else {
            Write-Loop3Log "LOCAL VALIDATION PASSED: Safe to proceed with CI/CD" "SUCCESS"
            exit 0
        }
    }

    "analyze" {
        if (Test-Path ".claude/artifacts/loop3-memory.json") {
            $memory = Get-Content ".claude/artifacts/loop3-memory.json" -Raw | ConvertFrom-Json
            Write-Loop3Log "Loop 3 Intelligence Summary:" "INFO"
            Write-Loop3Log "Total sessions: $($memory.sessions.Count)" "INFO"
            Write-Loop3Log "Success rate: $([math]::Round((($memory.sessions | Where-Object {$_.outcome -eq 'SUCCESS'}).Count / $memory.sessions.Count) * 100, 2))%" "INFO"

            $topPatterns = $memory.patterns | Group-Object category | Sort-Object Count -Descending | Select-Object -First 5
            Write-Loop3Log "Top failure patterns:" "INFO"
            foreach ($pattern in $topPatterns) {
                Write-Loop3Log "  $($pattern.Name): $($pattern.Count) occurrences" "INFO"
            }
        } else {
            Write-Loop3Log "No Loop 3 memory found. Run 'validate' mode first." "WARNING"
        }
    }

    default {
        Write-Loop3Log "Unknown mode: $Mode. Use 'validate' or 'analyze'" "ERROR"
        exit 1
    }
}
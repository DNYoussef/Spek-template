# Configure Environment Variables for Quality Thresholds

This guide explains how to configure environment variables to customize quality gate thresholds for different deployment environments.

## Quick Setup

### 1. GitHub Repository Secrets (Recommended)

1. Go to **Settings > Secrets and variables > Actions** in your GitHub repository
2. Click **New repository secret**
3. Add each threshold variable from the template below

### 2. Environment-Specific Configuration

```bash
# Copy the template file
cp .github/quality-thresholds.env.template .github/quality-thresholds.env

# Edit with your preferred values
nano .github/quality-thresholds.env
```

### 3. Docker/Local Development

```bash
# Source the environment file
source .github/quality-thresholds.env

# Or set variables directly
export NASA_MIN_SCORE=0.85
export SEC_MAX_CRITICAL=0
export CONN_MIN_QUALITY=0.70
```

## Environment Profiles

### 🚀 **Development Profile** (Fast Iteration)
```bash
NASA_MIN_SCORE=0.75
SEC_MAX_CRITICAL=1
SEC_MAX_HIGH=10
CONN_MAX_CRITICAL=10
ARCH_MIN_HEALTH=0.60
OVERALL_MIN_QUALITY=0.65
```

### 🧪 **Staging Profile** (Integration Testing)
```bash
NASA_MIN_SCORE=0.80
SEC_MAX_CRITICAL=0
SEC_MAX_HIGH=5
CONN_MAX_CRITICAL=7
ARCH_MIN_HEALTH=0.65
OVERALL_MIN_QUALITY=0.70
```

### 🏭 **Production Profile** (Strict Quality)
```bash
NASA_MIN_SCORE=0.90
SEC_MAX_CRITICAL=0
SEC_MAX_HIGH=1
CONN_MAX_CRITICAL=2
ARCH_MIN_HEALTH=0.80
OVERALL_MIN_QUALITY=0.85
```

### 🛡️ **Defense Industry Profile** (Maximum Security)
```bash
NASA_MIN_SCORE=0.95
SEC_MAX_CRITICAL=0
SEC_MAX_HIGH=0
SEC_MAX_SECRETS=0
CONN_MAX_CRITICAL=0
CONN_MAX_GOD_OBJECTS=1
ARCH_MIN_HEALTH=0.85
ARCH_MAX_COUPLING=0.40
OVERALL_MIN_QUALITY=0.90
```

## Variable Categories

### 🛡️ **NASA Compliance**
- `NASA_MIN_SCORE` - Minimum POT10 compliance (0.85 recommended)
- `NASA_MAX_CRITICAL` - Critical violations allowed (0 for defense)
- `NASA_MAX_HIGH` - High severity violations allowed (5 standard)

### 🔒 **Security Analysis**
- `SEC_MAX_CRITICAL` - Critical vulnerabilities allowed (0 recommended)
- `SEC_MAX_HIGH` - High vulnerabilities allowed (3 standard)
- `SEC_MAX_SECRETS` - Secrets detected allowed (0 for production)

### 📊 **Connascence Analysis**
- `CONN_MAX_CRITICAL` - Critical coupling violations (5 standard)
- `CONN_MIN_QUALITY` - Minimum quality score (0.70 recommended)
- `CONN_MAX_GOD_OBJECTS` - God objects allowed (3 standard)

### 🏗️ **Architecture Quality**
- `ARCH_MIN_HEALTH` - Minimum health score (0.70 recommended)
- `ARCH_MAX_COUPLING` - Maximum coupling (0.60 recommended)
- `ARCH_MIN_MAINTAINABILITY` - Minimum maintainability (0.65)

### ⚡ **Performance & Cache**
- `CACHE_MIN_HEALTH` - Minimum cache health (0.75 recommended)
- `PERF_MIN_CPU_EFFICIENCY` - Minimum CPU efficiency (0.70)

## Configuration Methods

### Method 1: GitHub Secrets (Production)

```bash
# Set in GitHub repository settings
gh secret set NASA_MIN_SCORE --body "0.85"
gh secret set SEC_MAX_CRITICAL --body "0"
gh secret set CONN_MIN_QUALITY --body "0.70"
# ... continue for all variables
```

### Method 2: Environment File (Development)

```bash
# Create .env file
cat > .env << 'EOF'
NASA_MIN_SCORE=0.75
SEC_MAX_CRITICAL=1
CONN_MIN_QUALITY=0.65
EOF

# Source in your shell
source .env
```

### Method 3: Workflow Environment (CI/CD)

```yaml
# In .github/workflows/*.yml
env:
  NASA_MIN_SCORE: ${{ vars.NASA_MIN_SCORE || '0.85' }}
  SEC_MAX_CRITICAL: ${{ vars.SEC_MAX_CRITICAL || '0' }}
  CONN_MIN_QUALITY: ${{ vars.CONN_MIN_QUALITY || '0.70' }}
```

### Method 4: Dynamic Configuration

```python
# In your quality gates script
import os

# Get threshold with fallback
nasa_threshold = float(os.getenv('NASA_MIN_SCORE', '0.85'))
security_threshold = int(os.getenv('SEC_MAX_CRITICAL', '0'))
quality_threshold = float(os.getenv('CONN_MIN_QUALITY', '0.70'))
```

## Environment-Specific Setup

### For Different Teams

**Backend Team** (Focus on security and performance):
```bash
SEC_MAX_CRITICAL=0
SEC_MAX_HIGH=1
PERF_MIN_CPU_EFFICIENCY=0.75
CACHE_MIN_EFFICIENCY=0.80
```

**Frontend Team** (Focus on architecture and cache):
```bash
ARCH_MIN_HEALTH=0.75
CACHE_MIN_HIT_RATE=0.70
CONN_MAX_GOD_OBJECTS=2
```

**DevOps Team** (Focus on compliance and monitoring):
```bash
NASA_MIN_SCORE=0.90
OVERALL_MIN_QUALITY=0.80
ENABLE_DEBUG_LOGGING=true
```

### For Different Projects

**Greenfield Project** (Learning mode):
```bash
NASA_MIN_SCORE=0.70
CONN_MAX_CRITICAL=15
ARCH_MIN_HEALTH=0.60
ENABLE_FALLBACK_MODE=true
```

**Legacy Migration** (Gradual improvement):
```bash
NASA_MIN_SCORE=0.75
CONN_MAX_CRITICAL=10
CONN_MAX_GOD_OBJECTS=5
OVERALL_MIN_QUALITY=0.65
```

**Critical System** (Maximum safety):
```bash
NASA_MIN_SCORE=0.95
SEC_MAX_CRITICAL=0
SEC_MAX_HIGH=0
CONN_MAX_CRITICAL=0
ARCH_MIN_HEALTH=0.85
```

## Testing Your Configuration

### 1. Validate Thresholds
```bash
# Run the quality gates with your settings
python .github/quality-gates.py

# Check exit code
echo $?  # 0 = passed, 1 = failed
```

### 2. Test with Sample Data
```bash
# Create test artifacts
mkdir -p .claude/.artifacts
echo '{"nasa_compliance": {"score": 0.90}}' > .claude/.artifacts/test.json

# Run validation
NASA_MIN_SCORE=0.85 python .github/quality-gates.py
```

### 3. Dry Run Workflows
```bash
# Test workflow locally with act
act -j quality-gate-enforcer --env-file .github/quality-thresholds.env
```

## Troubleshooting

### Common Issues

1. **Variables Not Loading**
   ```bash
   # Check if variables are set
   env | grep NASA_
   env | grep SEC_
   env | grep CONN_
   ```

2. **Threshold Too Strict**
   ```bash
   # Temporarily lower thresholds
   export NASA_MIN_SCORE=0.70
   export CONN_MAX_CRITICAL=10
   ```

3. **Quality Gates Always Failing**
   ```bash
   # Enable fallback mode
   export ENABLE_FALLBACK_MODE=true
   
   # Check analyzer outputs
   ls -la .claude/.artifacts/
   ```

### Debug Mode

```bash
# Enable detailed logging
export ENABLE_DEBUG_LOGGING=true
export ENABLE_FAILURE_ARTIFACTS=true

# Run with debug output
python .github/quality-gates.py --debug
```

## Best Practices

1. **Start Conservative**: Begin with relaxed thresholds and gradually tighten
2. **Environment Isolation**: Use different thresholds for dev/staging/prod
3. **Team Alignment**: Ensure all team members understand the thresholds
4. **Regular Review**: Adjust thresholds based on team capability and project needs
5. **Document Changes**: Track threshold changes in your repository

## Integration Examples

### GitHub Actions Integration
```yaml
- name: Run Quality Gates
  env:
    NASA_MIN_SCORE: ${{ vars.NASA_MIN_SCORE }}
    SEC_MAX_CRITICAL: ${{ vars.SEC_MAX_CRITICAL }}
    CONN_MIN_QUALITY: ${{ vars.CONN_MIN_QUALITY }}
  run: python .github/quality-gates.py
```

### Docker Integration
```dockerfile
# Copy environment template
COPY .github/quality-thresholds.env.template /app/.env

# Set environment variables
ENV NASA_MIN_SCORE=0.85
ENV SEC_MAX_CRITICAL=0
```

### CI/CD Pipeline Integration
```bash
#!/bin/bash
# Load environment-specific thresholds
if [ "$ENVIRONMENT" = "production" ]; then
    source .github/environments/production.env
elif [ "$ENVIRONMENT" = "staging" ]; then
    source .github/environments/staging.env
else
    source .github/environments/development.env
fi

# Run quality gates
python .github/quality-gates.py
```

This configuration system provides flexible, environment-specific quality gate thresholds that can be easily customized for different teams, projects, and deployment environments.
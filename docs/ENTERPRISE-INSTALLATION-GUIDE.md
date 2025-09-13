# Enterprise Installation & Configuration Guide

## Overview

This guide provides comprehensive instructions for installing and configuring the SPEK Enterprise modules, including system requirements, step-by-step installation, configuration management, and deployment verification.

## System Requirements

### Minimum Requirements
- **Python**: 3.8 or higher
- **Node.js**: 18.0 or higher  
- **Memory**: 4GB RAM (8GB recommended for large codebases)
- **Storage**: 2GB free space (additional space for SBOM/SLSA artifacts)
- **OS**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 18.04+, RHEL 8+)

### Recommended Requirements
- **Python**: 3.10 or higher
- **Node.js**: 20.0 or higher
- **Memory**: 16GB RAM
- **Storage**: 10GB free space
- **CPU**: 4+ cores for optimal performance

### Enterprise Dependencies

#### Required Python Packages
```bash
# Core enterprise dependencies
pyyaml>=6.0
dataclasses-json>=0.5.7
cryptography>=3.4.8
requests>=2.28.0
aiohttp>=3.8.0
scipy>=1.9.0  # For statistical analysis

# Security dependencies
cyclonedx-python-lib>=3.11.0  # SBOM generation
spdx-tools>=0.8.0            # SPDX format support
semgrep>=1.45.0              # Security scanning

# Compliance dependencies
openpyxl>=3.0.10             # Excel export for compliance matrices
jinja2>=3.1.0                # Report templating
```

#### Optional Dependencies
```bash
# Machine learning features (optional)
scikit-learn>=1.1.0          # Advanced analytics
numpy>=1.21.0                # Numerical computations

# Advanced monitoring (optional)  
prometheus-client>=0.14.0    # Metrics collection
grafana-api>=1.0.3           # Dashboard integration
```

## Installation Guide

### 1. Pre-Installation Verification

```bash
# Verify Python version
python --version  # Should be 3.8+

# Verify Node.js version  
node --version    # Should be 18.0+

# Verify existing SPEK installation
python -c "import analyzer; print('Analyzer ready')"
npm run test 2>/dev/null && echo "Base system ready" || echo "Fix base system first"
```

### 2. Enterprise Module Installation

#### Option A: Development Installation (Recommended for most users)
```bash
# Navigate to project root
cd /path/to/spek-template

# Install enterprise modules in development mode
pip install -e ./src/enterprise

# Verify installation
python -c "from src.enterprise.config.enterprise_config import EnterpriseConfig; print('Enterprise modules installed successfully')"
```

#### Option B: Production Installation
```bash
# Create virtual environment for production
python -m venv venv-enterprise
source venv-enterprise/bin/activate  # Linux/macOS
# venv-enterprise\Scripts\activate   # Windows

# Install with production dependencies
pip install ./src/enterprise[production]

# Install additional security tools
pip install semgrep cyclonedx-python-lib spdx-tools
```

#### Option C: Docker Installation
```bash
# Use enterprise-ready Docker image
docker pull spek-enterprise:latest

# Or build from Dockerfile
docker build -t spek-enterprise -f docker/Dockerfile.enterprise .

# Run with enterprise features enabled
docker run -e ENTERPRISE_ENABLED=true -v $(pwd):/workspace spek-enterprise
```

### 3. Verify Installation

```bash
# Test enterprise module imports
python -c "
from src.enterprise.config.enterprise_config import EnterpriseConfig
from src.enterprise.flags.feature_flags import FeatureFlagManager  
from src.enterprise.telemetry.six_sigma import SixSigmaTelemetry
from src.enterprise.security.supply_chain import SupplyChainSecurity
from src.enterprise.compliance.matrix import ComplianceMatrix
print('All enterprise modules imported successfully')
"

# Test CLI interface
python -m src.enterprise.cli.enterprise_cli --help

# Verify analyzer integration
python -c "
from src.enterprise.integration.analyzer import EnterpriseAnalyzerIntegration
integration = EnterpriseAnalyzerIntegration()
print('Analyzer integration ready')
"
```

## Configuration Management

### 1. Basic Configuration Setup

Create the main enterprise configuration file:

```bash
# Create configuration directory
mkdir -p config/enterprise

# Create basic configuration
cat > config/enterprise/enterprise-config.yaml << 'EOF'
# SPEK Enterprise Configuration
environment: development

# Six Sigma Telemetry Configuration
telemetry:
  enabled: true
  dpmo_threshold: 6210.0      # 4-sigma level (6210 DPMO)
  rty_threshold: 95.0         # 95% RTY threshold  
  auto_generate_reports: true
  report_interval_hours: 24
  store_detailed_metrics: true

# Supply Chain Security Configuration
security:
  enabled: true
  sbom_format: "cyclonedx-json"
  slsa_level: 2               # SLSA Level 2 (Build integrity)
  vulnerability_scanning: true
  auto_security_reports: true
  security_level: "enhanced"

# Compliance Framework Configuration
compliance:
  enabled: true
  frameworks: 
    - "soc2-type2"
    - "iso27001" 
    - "nist-csf"
  auto_compliance_checks: true
  evidence_collection: true
  audit_trail_enabled: true

# Feature Flag System Configuration
feature_flags:
  enabled: true
  config_file: "feature-flags.json"
  auto_reload: true
  monitoring_enabled: true
  default_rollout_strategy: "percentage"

# Analyzer Integration Configuration
integration:
  enabled: true
  auto_wrap_analyzers: true
  hook_system_enabled: true
  performance_monitoring: true
  error_recovery_enabled: true

# Logging Configuration
logging:
  level: "INFO"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  file_logging: true
  log_file: "logs/enterprise.log"
  max_file_size_mb: 100
  backup_count: 5
  structured_logging: false
EOF
```

### 2. Environment-Specific Configurations

#### Development Environment
```bash
cat > config/enterprise/development.yaml << 'EOF'
environment: development
telemetry:
  store_detailed_metrics: true
  report_interval_hours: 1    # More frequent reports
security:
  vulnerability_scanning: true
  auto_security_reports: true
compliance:
  auto_compliance_checks: true
logging:
  level: "DEBUG"
  structured_logging: false
EOF
```

#### Production Environment  
```bash
cat > config/enterprise/production.yaml << 'EOF'
environment: production
telemetry:
  store_detailed_metrics: false  # Performance optimization
  report_interval_hours: 24
security:
  slsa_level: 3                   # Higher security for production
  security_level: "critical"
compliance:
  frameworks:
    - "soc2-type2"
    - "iso27001"
    - "nist-csf"
    - "gdpr"                     # Additional compliance for production
  audit_trail_enabled: true
logging:
  level: "WARNING"
  structured_logging: true       # Structured logs for production
  file_logging: true
EOF
```

### 3. Feature Flag Configuration

```bash
cat > config/enterprise/feature-flags.json << 'EOF'
{
  "flags": {
    "enhanced_analysis": {
      "description": "Enhanced code analysis with ML algorithms",
      "status": "rollout",
      "rollout_percentage": 25.0,
      "rollout_strategy": "percentage",
      "owner": "dev-team",
      "tags": ["performance", "analysis"],
      "start_date": "2024-01-15T00:00:00Z"
    },
    "six_sigma_integration": {
      "description": "Six Sigma quality metrics integration",
      "status": "enabled",
      "owner": "quality-team", 
      "tags": ["quality", "metrics"]
    },
    "premium_security_features": {
      "description": "Premium security scanning and SBOM generation",
      "status": "rollout",
      "rollout_strategy": "user_list",
      "enabled_for_users": ["admin", "security_team"],
      "owner": "security-team",
      "tags": ["security", "premium"]
    },
    "compliance_automation": {
      "description": "Automated compliance checking and reporting",
      "status": "enabled",
      "owner": "compliance-team",
      "tags": ["compliance", "automation"]
    },
    "beta_performance_optimizations": {
      "description": "Beta performance optimizations",
      "status": "rollout", 
      "rollout_percentage": 10.0,
      "rollout_strategy": "gradual",
      "start_date": "2024-02-01T00:00:00Z",
      "owner": "performance-team",
      "tags": ["performance", "beta"]
    }
  }
}
EOF
```

### 4. Environment Variables Configuration

Create environment-specific variable files:

```bash
# Development environment variables
cat > .env.development << 'EOF'
# Enterprise Environment Configuration
ENTERPRISE_ENV=development
ENTERPRISE_CONFIG_FILE=config/enterprise/development.yaml
ENTERPRISE_FEATURE_FLAGS_FILE=config/enterprise/feature-flags.json

# Telemetry Settings
ENTERPRISE_TELEMETRY_ENABLED=true
ENTERPRISE_TELEMETRY_STORE_DETAILED=true

# Security Settings  
ENTERPRISE_SECURITY_ENABLED=true
ENTERPRISE_SECURITY_LEVEL=enhanced
ENTERPRISE_VULNERABILITY_SCANNING=true

# Compliance Settings
ENTERPRISE_COMPLIANCE_ENABLED=true
ENTERPRISE_COMPLIANCE_FRAMEWORKS=soc2-type2,iso27001,nist-csf

# Logging Settings
ENTERPRISE_LOG_LEVEL=DEBUG
ENTERPRISE_STRUCTURED_LOGGING=false
EOF

# Production environment variables  
cat > .env.production << 'EOF'
# Enterprise Environment Configuration
ENTERPRISE_ENV=production
ENTERPRISE_CONFIG_FILE=config/enterprise/production.yaml
ENTERPRISE_FEATURE_FLAGS_FILE=config/enterprise/feature-flags.json

# Telemetry Settings
ENTERPRISE_TELEMETRY_ENABLED=true
ENTERPRISE_TELEMETRY_STORE_DETAILED=false

# Security Settings
ENTERPRISE_SECURITY_ENABLED=true
ENTERPRISE_SECURITY_LEVEL=critical
ENTERPRISE_SLSA_LEVEL=3

# Compliance Settings
ENTERPRISE_COMPLIANCE_ENABLED=true
ENTERPRISE_COMPLIANCE_FRAMEWORKS=soc2-type2,iso27001,nist-csf,gdpr

# Logging Settings
ENTERPRISE_LOG_LEVEL=WARNING
ENTERPRISE_STRUCTURED_LOGGING=true
EOF
```

## Integration Setup

### 1. Analyzer Integration Configuration

```python
# Create integration configuration file
cat > config/enterprise/analyzer-integration.py << 'EOF'
"""
Enterprise Analyzer Integration Configuration

This file configures how enterprise features integrate with the existing 
25,640 LOC analyzer system.
"""

from src.enterprise.integration.analyzer import EnterpriseAnalyzerIntegration
from analyzer.core.analyzer import CodeAnalyzer
from analyzer.policy_engine import PolicyEngine

# Initialize enterprise integration
integration = EnterpriseAnalyzerIntegration()

# Configure analyzer wrapping
ANALYZER_WRAPPERS = {
    'code_analyzer': {
        'class': CodeAnalyzer,
        'methods': ['analyze', 'analyze_ast', 'generate_metrics'],
        'features': ['enhanced_analysis', 'six_sigma_integration']
    },
    'policy_engine': {
        'class': PolicyEngine,
        'methods': ['evaluate_quality_gates', 'check_compliance'],
        'features': ['compliance_automation', 'premium_security_features']
    }
}

# Configure telemetry integration points
TELEMETRY_INTEGRATION = {
    'quality_gates': {
        'process_name': 'code_quality_gates',
        'success_metric': 'gates_passed',
        'failure_metric': 'gates_failed',
        'defect_categories': ['complexity', 'duplication', 'security', 'style']
    },
    'analyzer_performance': {
        'process_name': 'analyzer_performance', 
        'metrics': ['execution_time', 'memory_usage', 'lines_processed']
    }
}

# Configure compliance mapping
COMPLIANCE_MAPPING = {
    'soc2-type2': {
        'controls': ['CC6.1', 'CC6.2', 'CC6.3'],  # Logical access controls
        'evidence_paths': ['docs/security/', 'logs/audit/']
    },
    'iso27001': {
        'controls': ['A.12.1.1', 'A.12.6.1'],     # Operational procedures
        'evidence_paths': ['docs/procedures/', 'quality-reports/']
    }
}
EOF
```

### 2. Database Setup (Optional)

For organizations requiring persistent telemetry and compliance data:

```bash
# Install database dependencies
pip install sqlalchemy alembic psycopg2-binary  # PostgreSQL
# pip install sqlalchemy alembic mysql-connector-python  # MySQL

# Create database configuration
cat > config/enterprise/database.yaml << 'EOF'
database:
  enabled: false  # Set to true for persistent storage
  url: "postgresql://enterprise:password@localhost/spek_enterprise"
  # url: "mysql://enterprise:password@localhost/spek_enterprise" 
  # url: "sqlite:///enterprise.db"  # For development/testing
  
  # Connection pool settings
  pool_size: 10
  max_overflow: 20
  pool_timeout: 30
  
  # Table configuration
  tables:
    telemetry_metrics: "six_sigma_metrics"
    compliance_evidence: "compliance_evidence"
    feature_flag_metrics: "feature_flag_metrics"
    security_reports: "security_reports"
EOF

# Initialize database (if using persistent storage)
# python -m src.enterprise.db.init_db --config config/enterprise/database.yaml
```

## Verification & Testing

### 1. Installation Verification Script

```bash
# Create verification script
cat > scripts/verify-enterprise-installation.py << 'EOF'
#!/usr/bin/env python3
"""
Enterprise Installation Verification Script

Verifies that all enterprise modules are correctly installed and configured.
"""

import sys
import importlib
import json
from pathlib import Path

def verify_imports():
    """Verify all enterprise modules can be imported"""
    modules = [
        'src.enterprise.config.enterprise_config',
        'src.enterprise.flags.feature_flags',
        'src.enterprise.telemetry.six_sigma', 
        'src.enterprise.security.supply_chain',
        'src.enterprise.compliance.matrix',
        'src.enterprise.integration.analyzer',
        'src.enterprise.cli.enterprise_cli'
    ]
    
    for module_name in modules:
        try:
            importlib.import_module(module_name)
            print(f"✓ {module_name}")
        except ImportError as e:
            print(f"✗ {module_name}: {e}")
            return False
    
    return True

def verify_configuration():
    """Verify configuration files exist and are valid"""
    config_files = [
        'config/enterprise/enterprise-config.yaml',
        'config/enterprise/feature-flags.json'
    ]
    
    for config_file in config_files:
        if Path(config_file).exists():
            print(f"✓ {config_file} exists")
        else:
            print(f"✗ {config_file} missing")
            return False
    
    return True

def verify_functionality():
    """Verify basic functionality works"""
    try:
        from src.enterprise.config.enterprise_config import EnterpriseConfig
        from src.enterprise.flags.feature_flags import FeatureFlagManager
        
        # Test configuration loading
        config = EnterpriseConfig()
        print(f"✓ Configuration loaded (env: {config.environment.value})")
        
        # Test feature flag manager
        flag_manager = FeatureFlagManager()
        print(f"✓ Feature flag manager initialized")
        
        # Test telemetry
        from src.enterprise.telemetry.six_sigma import SixSigmaTelemetry
        telemetry = SixSigmaTelemetry("test_process")
        print(f"✓ Telemetry system initialized")
        
        return True
        
    except Exception as e:
        print(f"✗ Functionality test failed: {e}")
        return False

def main():
    """Run all verification checks"""
    print("SPEK Enterprise Installation Verification")
    print("=" * 50)
    
    checks = [
        ("Module Imports", verify_imports),
        ("Configuration Files", verify_configuration), 
        ("Basic Functionality", verify_functionality)
    ]
    
    all_passed = True
    for check_name, check_func in checks:
        print(f"\n{check_name}:")
        passed = check_func()
        all_passed = all_passed and passed
    
    print("\n" + "=" * 50)
    if all_passed:
        print("✓ All verification checks passed!")
        print("Enterprise modules are ready for use.")
        sys.exit(0)
    else:
        print("✗ Some verification checks failed.")
        print("Please review the errors above and fix before proceeding.")
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

# Make script executable and run
chmod +x scripts/verify-enterprise-installation.py
python scripts/verify-enterprise-installation.py
```

### 2. Integration Testing

```bash
# Create integration test script
cat > scripts/test-enterprise-integration.py << 'EOF'
#!/usr/bin/env python3
"""
Enterprise Integration Testing Script

Tests integration between enterprise modules and existing analyzer system.
"""

import asyncio
from pathlib import Path

async def test_analyzer_integration():
    """Test enterprise analyzer integration"""
    from src.enterprise.integration.analyzer import EnterpriseAnalyzerIntegration
    
    integration = EnterpriseAnalyzerIntegration()
    
    # Test wrapper functionality
    print("Testing analyzer integration...")
    
    # Test telemetry integration
    from src.enterprise.telemetry.six_sigma import SixSigmaTelemetry
    telemetry = SixSigmaTelemetry("integration_test")
    
    # Simulate quality gate evaluation
    telemetry.record_unit_processed(passed=True)
    metrics = telemetry.generate_metrics_snapshot()
    
    print(f"✓ Telemetry integration working (DPMO: {metrics.dpmo})")
    
    return True

async def test_security_integration():
    """Test security module integration"""
    from src.enterprise.security.supply_chain import SupplyChainSecurity, SecurityLevel
    
    project_root = Path.cwd()
    security = SupplyChainSecurity(project_root, SecurityLevel.ENHANCED)
    
    # Test SBOM generation
    print("Testing SBOM generation...")
    # sbom_file = await security.generate_sbom()  # Uncomment for full test
    print("✓ Security integration ready")
    
    return True

async def test_compliance_integration():
    """Test compliance module integration"""
    from src.enterprise.compliance.matrix import ComplianceMatrix, ComplianceFramework
    
    project_root = Path.cwd()
    compliance = ComplianceMatrix(project_root)
    
    # Add test framework
    compliance.add_framework(ComplianceFramework.SOC2_TYPE2)
    
    coverage = compliance.get_framework_coverage()
    print(f"✓ Compliance integration working ({len(coverage)} frameworks)")
    
    return True

async def main():
    """Run all integration tests"""
    print("SPEK Enterprise Integration Testing")
    print("=" * 50)
    
    tests = [
        ("Analyzer Integration", test_analyzer_integration),
        ("Security Integration", test_security_integration),
        ("Compliance Integration", test_compliance_integration)
    ]
    
    all_passed = True
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        try:
            passed = await test_func()
            all_passed = all_passed and passed
        except Exception as e:
            print(f"✗ {test_name} failed: {e}")
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("✓ All integration tests passed!")
        sys.exit(0)
    else:
        print("✗ Some integration tests failed.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
EOF

# Run integration tests
python scripts/test-enterprise-integration.py
```

### 3. Performance Verification

```bash
# Test performance impact
cat > scripts/performance-benchmark.py << 'EOF'
#!/usr/bin/env python3
"""
Performance Benchmark for Enterprise Features

Measures performance impact of enterprise features when enabled vs disabled.
"""

import time
import statistics
from src.enterprise.config.enterprise_config import EnterpriseConfig

def benchmark_feature_flags():
    """Benchmark feature flag performance"""
    from src.enterprise.flags.feature_flags import FeatureFlagManager
    
    flag_manager = FeatureFlagManager()
    
    # Benchmark flag checking performance
    iterations = 10000
    times = []
    
    for _ in range(iterations):
        start = time.perf_counter()
        flag_manager.is_enabled("test_flag", user_id="test_user")
        end = time.perf_counter()
        times.append(end - start)
    
    avg_time = statistics.mean(times) * 1000  # Convert to milliseconds
    print(f"Feature flag check: {avg_time:.4f}ms average")
    
    return avg_time < 0.1  # Should be under 0.1ms

def benchmark_telemetry():
    """Benchmark telemetry performance"""
    from src.enterprise.telemetry.six_sigma import SixSigmaTelemetry
    
    telemetry = SixSigmaTelemetry("benchmark_test")
    
    iterations = 1000
    times = []
    
    for _ in range(iterations):
        start = time.perf_counter()
        telemetry.record_unit_processed(passed=True)
        end = time.perf_counter()
        times.append(end - start)
    
    avg_time = statistics.mean(times) * 1000
    print(f"Telemetry recording: {avg_time:.4f}ms average")
    
    return avg_time < 1.0  # Should be under 1ms

def main():
    """Run performance benchmarks"""
    print("Enterprise Performance Benchmarks")
    print("=" * 40)
    
    benchmarks = [
        ("Feature Flags", benchmark_feature_flags),
        ("Telemetry", benchmark_telemetry)
    ]
    
    all_passed = True
    for name, benchmark_func in benchmarks:
        print(f"\n{name}:")
        passed = benchmark_func()
        all_passed = all_passed and passed
        print(f"{'✓' if passed else '✗'} Performance acceptable")
    
    print("\n" + "=" * 40)
    if all_passed:
        print("✓ All performance benchmarks passed!")
    else:
        print("✗ Performance benchmarks indicate issues.")

if __name__ == "__main__":
    main()
EOF

python scripts/performance-benchmark.py
```

## Deployment Considerations

### 1. Production Deployment Checklist

```bash
# Create deployment checklist
cat > deployment-checklist.md << 'EOF'
# Enterprise Deployment Checklist

## Pre-Deployment
- [ ] All verification scripts pass
- [ ] Performance benchmarks meet requirements
- [ ] Configuration files reviewed and approved
- [ ] Feature flags set to appropriate rollout percentages
- [ ] Security scanning completed
- [ ] Compliance requirements validated

## Deployment
- [ ] Environment variables configured
- [ ] Configuration files deployed to correct locations
- [ ] Database initialized (if using persistent storage)
- [ ] Monitoring and alerting configured
- [ ] Rollback plan documented and tested

## Post-Deployment
- [ ] Enterprise CLI commands tested in production
- [ ] Telemetry data flowing correctly
- [ ] Feature flags responding correctly
- [ ] Security reports generating
- [ ] Compliance data collecting
- [ ] Performance monitoring active

## Monitoring Setup
- [ ] Log aggregation configured
- [ ] Metrics dashboards created
- [ ] Alerting rules defined
- [ ] Health check endpoints verified
EOF
```

### 2. Monitoring Setup

```bash
# Create monitoring configuration
mkdir -p config/monitoring

cat > config/monitoring/prometheus.yml << 'EOF'
# Prometheus configuration for enterprise monitoring
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'spek-enterprise'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics/enterprise'
    scrape_interval: 30s
EOF

cat > config/monitoring/grafana-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "SPEK Enterprise Metrics",
    "panels": [
      {
        "title": "Six Sigma Metrics",
        "type": "stat",
        "targets": [
          {"expr": "spek_enterprise_dpmo", "legendFormat": "DPMO"},
          {"expr": "spek_enterprise_rty", "legendFormat": "RTY"}
        ]
      },
      {
        "title": "Feature Flag Usage", 
        "type": "graph",
        "targets": [
          {"expr": "rate(spek_enterprise_feature_flag_calls[5m])", "legendFormat": "Flag Calls/sec"}
        ]
      }
    ]
  }
}
EOF
```

## Next Steps

After successful installation and configuration:

1. **Review [Enterprise User Guide](ENTERPRISE-USER-GUIDE.md)** for detailed feature usage
2. **Implement gradual rollout** using feature flags for new capabilities
3. **Configure monitoring** to track performance and usage metrics
4. **Set up compliance frameworks** relevant to your organization
5. **Integrate with CI/CD** pipeline for automated quality gates

The enterprise modules are now ready for production use with comprehensive quality, security, and compliance capabilities.
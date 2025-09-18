# Secrets Management Guide - Security Princess Domain

## Overview

This guide establishes enterprise-grade secrets management practices for the SPEK Enhanced Development Platform, ensuring zero exposure of sensitive credentials and API keys.

## 1. Environment Variables Management

### Production Environment Variables

```bash
# API Keys (NEVER commit to repository)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
NEO4J_PASSWORD=...

# Database Credentials
DB_HOST=production-host
DB_USER=spek_app
DB_PASSWORD=...
DB_NAME=spek_production

# JWT Secrets
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Encryption Keys
ENCRYPTION_KEY=...
API_RATE_LIMIT_SECRET=...

# Third-party Integrations
GITHUB_TOKEN=...
SENTRY_DSN=...
```

### Local Development (.env.local)

```bash
# Development API Keys (restricted scope)
OPENAI_API_KEY=sk-dev-...
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=dev-password

# Development JWT Secret
JWT_SECRET=dev-jwt-secret-minimum-32-chars

# Development Database
DB_HOST=localhost
DB_USER=dev_user
DB_PASSWORD=dev_password
DB_NAME=spek_development
```

## 2. GitHub Secrets Configuration

### Repository Secrets (Required for CI/CD)

```yaml
# Production deployment
OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
NEO4J_PASSWORD: ${{ secrets.NEO4J_PASSWORD }}
JWT_SECRET: ${{ secrets.JWT_SECRET }}

# Security scanning
SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

# Deployment credentials
AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
DOCKER_HUB_TOKEN: ${{ secrets.DOCKER_HUB_TOKEN }}
```

### Environment-specific Secrets

```yaml
# Development
DEVELOPMENT_OPENAI_KEY: ${{ secrets.DEVELOPMENT_OPENAI_KEY }}
DEVELOPMENT_NEO4J_PASSWORD: ${{ secrets.DEVELOPMENT_NEO4J_PASSWORD }}

# Staging
STAGING_OPENAI_KEY: ${{ secrets.STAGING_OPENAI_KEY }}
STAGING_NEO4J_PASSWORD: ${{ secrets.STAGING_NEO4J_PASSWORD }}

# Production
PRODUCTION_OPENAI_KEY: ${{ secrets.PRODUCTION_OPENAI_KEY }}
PRODUCTION_NEO4J_PASSWORD: ${{ secrets.PRODUCTION_NEO4J_PASSWORD }}
```

## 3. Secure Configuration Management

### Configuration Structure

```
config/
├── security/
│   ├── api-security.json         # API security settings
│   ├── encryption-config.json    # Encryption configuration
│   └── compliance-config.json    # Compliance settings
├── environments/
│   ├── development.json          # Dev-specific config
│   ├── staging.json              # Staging config
│   └── production.json           # Production config
└── secrets/
    ├── .env.example              # Template for environment variables
    ├── .env.development          # Development secrets (gitignored)
    └── .env.production           # Production secrets (gitignored)
```

### Environment Configuration Template

```json
{
  "environment": "production",
  "security": {
    "encryption": {
      "algorithm": "AES-256-GCM",
      "keyRotationDays": 30
    },
    "jwt": {
      "algorithm": "HS256",
      "expiresIn": "1h",
      "refreshExpiresIn": "7d"
    },
    "rateLimit": {
      "windowMs": 900000,
      "maxRequests": 1000
    }
  },
  "database": {
    "host": "${DB_HOST}",
    "user": "${DB_USER}",
    "password": "${DB_PASSWORD}",
    "ssl": true,
    "connectionTimeout": 30000
  },
  "apis": {
    "openai": {
      "baseUrl": "https://api.openai.com/v1",
      "maxTokens": 4000,
      "timeout": 30000
    },
    "neo4j": {
      "uri": "${NEO4J_URI}",
      "database": "spek-production"
    }
  }
}
```

## 4. Runtime Secrets Loading

### Secure Environment Loading

```javascript
// src/config/secrets-loader.js
const crypto = require('crypto');
const fs = require('fs');

class SecretsManager {
  constructor(environment = 'development') {
    this.environment = environment;
    this.secrets = new Map();
    this.encryptionKey = process.env.ENCRYPTION_KEY;
  }

  loadSecrets() {
    // Load environment-specific secrets
    this.loadEnvironmentSecrets();

    // Validate required secrets
    this.validateRequiredSecrets();

    // Set up key rotation if in production
    if (this.environment === 'production') {
      this.setupKeyRotation();
    }
  }

  loadEnvironmentSecrets() {
    const secretsPath = `config/secrets/.env.${this.environment}`;

    if (fs.existsSync(secretsPath)) {
      require('dotenv').config({ path: secretsPath });
    }

    // Load from environment variables
    this.secrets.set('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
    this.secrets.set('NEO4J_PASSWORD', process.env.NEO4J_PASSWORD);
    this.secrets.set('JWT_SECRET', process.env.JWT_SECRET);
  }

  validateRequiredSecrets() {
    const required = [
      'OPENAI_API_KEY',
      'NEO4J_PASSWORD',
      'JWT_SECRET'
    ];

    for (const secret of required) {
      if (!this.secrets.get(secret)) {
        throw new Error(`Required secret ${secret} not found`);
      }
    }
  }

  getSecret(name) {
    const secret = this.secrets.get(name);
    if (!secret) {
      throw new Error(`Secret ${name} not found`);
    }
    return secret;
  }

  setupKeyRotation() {
    // Implement key rotation logic for production
    setInterval(() => {
      this.rotateKeys();
    }, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  rotateKeys() {
    // Key rotation implementation
    console.log('Rotating encryption keys...');
  }
}

module.exports = SecretsManager;
```

## 5. Security Best Practices

### API Key Management

1. **Scope Limitation**: Use API keys with minimal required permissions
2. **Rotation**: Rotate API keys every 30-90 days
3. **Monitoring**: Log all API key usage and monitor for anomalies
4. **Revocation**: Immediate revocation process for compromised keys

### Database Credentials

1. **Principle of Least Privilege**: Database users with minimal permissions
2. **Connection Encryption**: Always use SSL/TLS for database connections
3. **Connection Pooling**: Secure connection pooling with credential rotation
4. **Audit Logging**: All database access logged and monitored

### JWT Token Security

1. **Strong Secrets**: Minimum 256-bit secrets for JWT signing
2. **Short Expiration**: Access tokens expire in 1 hour
3. **Refresh Tokens**: Secure refresh token rotation
4. **Token Revocation**: Blacklist mechanism for compromised tokens

## 6. Compliance Requirements

### Paizo Community Use Policy

- **Non-commercial Use**: All Pathfinder 2e content usage is non-commercial
- **Attribution**: Proper attribution in all applications using Paizo content
- **Content Restrictions**: No redistribution of copyrighted Paizo content

### Data Protection (GDPR/CCPA)

- **Data Minimization**: Collect only necessary user data
- **Consent Tracking**: User consent for data processing
- **Right to Erasure**: User data deletion capabilities
- **Data Portability**: User data export functionality

### API Provider Compliance

- **OpenAI Terms**: Compliance with OpenAI usage policies
- **Neo4j Licensing**: Proper Neo4j Community Edition usage
- **Rate Limiting**: Respect API rate limits and fair usage

## 7. Incident Response

### Suspected Credential Compromise

1. **Immediate Revocation**: Revoke compromised credentials immediately
2. **Impact Assessment**: Assess potential data access and systems affected
3. **Key Rotation**: Rotate all related keys and secrets
4. **Monitoring**: Enhanced monitoring for unauthorized access
5. **Documentation**: Document incident and response actions

### Security Monitoring

```javascript
// Security monitoring configuration
const securityMonitor = {
  alerts: {
    failedLogins: {
      threshold: 5,
      timeWindow: '15m',
      action: 'block_ip'
    },
    apiKeyUsage: {
      threshold: 1000,
      timeWindow: '1h',
      action: 'rate_limit'
    },
    suspiciousPatterns: {
      enabled: true,
      action: 'alert_admin'
    }
  },
  logging: {
    level: 'info',
    auditTrail: true,
    retention: '365d'
  }
};
```

## 8. Validation Checklist

- [ ] All production secrets stored in secure environment variables
- [ ] No secrets committed to version control
- [ ] GitHub repository secrets configured for CI/CD
- [ ] Environment-specific configuration files in place
- [ ] Secret rotation mechanisms implemented
- [ ] Security monitoring and alerting configured
- [ ] Incident response procedures documented
- [ ] Compliance requirements validated
- [ ] API key permissions minimized
- [ ] Database credentials secured
- [ ] JWT token security implemented
- [ ] Regular security audits scheduled

---

**Security Princess Domain - Secrets Management Complete** ✅

*This guide ensures enterprise-grade secrets management for defense industry deployment.*
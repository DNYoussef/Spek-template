# /enterprise:security:sbom

## Purpose
Generate comprehensive Software Bill of Materials (SBOM) in SPDX and CycloneDX formats with complete dependency mapping, vulnerability correlation, and supply chain risk analysis. Provides cryptographic signing and provenance tracking for defense industry compliance.

## Usage
/enterprise:security:sbom [--format=spdx-json|cyclonedx-json|both] [--output=<filename>] [--sign] [--include-dev-deps] [--vulnerability-correlation]

## Implementation

### 1. SBOM Format Configuration

#### Format Selection and Validation:
```bash
# Determine SBOM format and output configuration
configure_sbom_generation() {
    local format="$1"
    local output_file="$2"
    local sign_flag="$3"
    local include_dev="$4"

    # Set default format if not specified
    if [[ "$format" == "" ]]; then
        format="cyclonedx-json"
    fi

    # Validate format support
    local supported_formats=("spdx-json" "cyclonedx-json" "both")
    if [[ ! " ${supported_formats[@]} " =~ " ${format} " ]]; then
        echo "ERROR: Unsupported SBOM format '$format'. Supported: ${supported_formats[*]}" >&2
        exit 1
    fi

    # Set default output file if not specified
    if [[ "$output_file" == "" ]]; then
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        output_file=".claude/.artifacts/sbom_$timestamp"
    fi

    echo "Format: $format, Output: $output_file, Sign: ${sign_flag:-false}, Dev deps: ${include_dev:-false}"
}
```

#### SBOM Generation Configuration:
```javascript
const SBOM_CONFIGURATIONS = {
  spdx: {
    version: "SPDX-2.3",
    format: "JSON",
    namespace_prefix: "https://spek.enterprise.com/",
    creator_tools: ["SPEK-Enterprise-SBOM-Generator"],
    license_list_version: "3.21",
    document_name: "SPEK Enterprise Project SBOM"
  },

  cyclonedx: {
    spec_version: "1.5",
    format: "JSON",
    schema_version: "https://cyclonedx.org/schema/1.5/bom-1.5.schema.json",
    serial_number: null, // Generated per SBOM
    version: 1,
    metadata_timestamp: null // Generated at runtime
  },

  analysis_options: {
    include_transitive: true,
    include_dev_dependencies: false,
    vulnerability_enrichment: true,
    license_analysis: true,
    provenance_tracking: true,
    cryptographic_hashing: "SHA-256"
  }
};
```

### 2. Dependency Discovery and Analysis

#### Multi-Language Dependency Detection:
```javascript
async function discoverDependencies(projectPath, includeDevDeps) {
  const dependencies = {
    direct: [],
    transitive: [],
    dev: [],
    metadata: {},
    analysis_errors: []
  };

  const packageManagers = [
    { name: 'npm', files: ['package.json', 'package-lock.json'], detector: analyzeNpmDependencies },
    { name: 'pip', files: ['requirements.txt', 'Pipfile', 'setup.py'], detector: analyzePythonDependencies },
    { name: 'maven', files: ['pom.xml'], detector: analyzeMavenDependencies },
    { name: 'gradle', files: ['build.gradle', 'gradle.lock'], detector: analyzeGradleDependencies },
    { name: 'cargo', files: ['Cargo.toml', 'Cargo.lock'], detector: analyzeRustDependencies },
    { name: 'go', files: ['go.mod', 'go.sum'], detector: analyzeGoDependencies }
  ];

  for (const pm of packageManagers) {
    const detectedFiles = pm.files.filter(file => fs.existsSync(path.join(projectPath, file)));

    if (detectedFiles.length > 0) {
      try {
        const pmResults = await pm.detector(projectPath, detectedFiles, includeDevDeps);
        dependencies.direct.push(...pmResults.direct);
        dependencies.transitive.push(...pmResults.transitive);
        if (includeDevDeps) {
          dependencies.dev.push(...pmResults.dev);
        }
        dependencies.metadata[pm.name] = pmResults.metadata;
      } catch (error) {
        dependencies.analysis_errors.push({
          package_manager: pm.name,
          error: error.message,
          files: detectedFiles
        });
      }
    }
  }

  return dependencies;
}

async function analyzeNpmDependencies(projectPath, files, includeDevDeps) {
  const results = { direct: [], transitive: [], dev: [], metadata: {} };

  const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
  const lockFile = files.includes('package-lock.json') ?
    JSON.parse(fs.readFileSync(path.join(projectPath, 'package-lock.json'), 'utf8')) : null;

  // Extract direct dependencies
  if (packageJson.dependencies) {
    for (const [name, version] of Object.entries(packageJson.dependencies)) {
      const depInfo = await enrichDependencyInfo(name, version, lockFile);
      results.direct.push(depInfo);
    }
  }

  // Extract development dependencies if requested
  if (includeDevDeps && packageJson.devDependencies) {
    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
      const depInfo = await enrichDependencyInfo(name, version, lockFile);
      results.dev.push(depInfo);
    }
  }

  // Extract transitive dependencies from lock file
  if (lockFile && lockFile.packages) {
    const transitiveDeps = Object.entries(lockFile.packages)
      .filter(([path, info]) => path.startsWith('node_modules/') && !path.includes('/node_modules/', 13))
      .map(([path, info]) => ({
        name: path.replace('node_modules/', ''),
        version: info.version,
        resolved: info.resolved,
        integrity: info.integrity,
        source: 'transitive'
      }));

    results.transitive.push(...transitiveDeps);
  }

  results.metadata = {
    package_manager: 'npm',
    project_name: packageJson.name,
    project_version: packageJson.version,
    node_version: process.version,
    total_dependencies: results.direct.length + results.transitive.length + results.dev.length
  };

  return results;
}
```

### 3. Vulnerability Correlation and Risk Analysis

#### Security Enrichment Engine:
```javascript
async function performVulnerabilityCorrelation(dependencies) {
  const vulnerabilityResults = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    summary: {},
    risk_score: 0,
    supply_chain_risks: []
  };

  // Query multiple vulnerability databases
  const vulnSources = [
    { name: 'NVD', api: queryNVDDatabase },
    { name: 'OSV', api: queryOSVDatabase },
    { name: 'Snyk', api: querySnykDatabase },
    { name: 'GitHub Advisory', api: queryGitHubAdvisory }
  ];

  for (const dep of [...dependencies.direct, ...dependencies.transitive, ...dependencies.dev]) {
    const depVulns = {
      component: dep,
      vulnerabilities: [],
      risk_factors: []
    };

    // Query each vulnerability source
    for (const source of vulnSources) {
      try {
        const vulns = await source.api(dep.name, dep.version);
        depVulns.vulnerabilities.push(...vulns.map(v => ({ ...v, source: source.name })));
      } catch (error) {
        console.warn(`Failed to query ${source.name} for ${dep.name}: ${error.message}`);
      }
    }

    // Categorize vulnerabilities by severity
    for (const vuln of depVulns.vulnerabilities) {
      const severity = vuln.severity?.toLowerCase() || 'unknown';
      if (vulnerabilityResults[severity]) {
        vulnerabilityResults[severity].push({
          component: dep.name,
          version: dep.version,
          vulnerability: vuln
        });
      }
    }

    // Analyze supply chain risks
    const riskFactors = analyzeSupplyChainRisks(dep);
    if (riskFactors.length > 0) {
      vulnerabilityResults.supply_chain_risks.push({
        component: dep.name,
        version: dep.version,
        risk_factors: riskFactors
      });
    }
  }

  // Calculate overall risk score
  vulnerabilityResults.risk_score = calculateRiskScore(vulnerabilityResults);

  // Generate summary statistics
  vulnerabilityResults.summary = {
    total_vulnerabilities: Object.values(vulnerabilityResults).flat().length,
    by_severity: {
      critical: vulnerabilityResults.critical.length,
      high: vulnerabilityResults.high.length,
      medium: vulnerabilityResults.medium.length,
      low: vulnerabilityResults.low.length
    },
    high_risk_components: vulnerabilityResults.supply_chain_risks.length,
    overall_risk_level: determineRiskLevel(vulnerabilityResults.risk_score)
  };

  return vulnerabilityResults;
}

function analyzeSupplyChainRisks(dependency) {
  const riskFactors = [];

  // Check for abandoned/unmaintained packages
  if (dependency.lastUpdate && (Date.now() - new Date(dependency.lastUpdate)) > (365 * 24 * 60 * 60 * 1000)) {
    riskFactors.push({
      type: 'maintenance',
      severity: 'medium',
      description: 'Package not updated in over 1 year',
      impact: 'Potential security issues may not be addressed'
    });
  }

  // Check for suspicious package patterns
  if (dependency.name.match(/[0-9]{10,}|[a-f0-9]{32,}/)) {
    riskFactors.push({
      type: 'suspicious_naming',
      severity: 'high',
      description: 'Package name contains suspicious patterns',
      impact: 'Possible typosquatting or malicious package'
    });
  }

  // Check for packages with excessive permissions
  if (dependency.permissions && dependency.permissions.includes('filesystem_access')) {
    riskFactors.push({
      type: 'permissions',
      severity: 'medium',
      description: 'Package requests filesystem access',
      impact: 'Potential for unauthorized file system modifications'
    });
  }

  return riskFactors;
}
```

### 4. SBOM Generation (CycloneDX Format)

#### CycloneDX SBOM Generation:
```bash
# Generate CycloneDX format SBOM
generate_cyclonedx_sbom() {
    local output_file="$1"
    local include_dev="$2"
    local vulnerability_correlation="$3"
    local sign_flag="$4"

    echo "[CHART] Generating CycloneDX SBOM with vulnerability correlation"

    # Create artifacts directory
    mkdir -p .claude/.artifacts

    # Generate SBOM using Python enterprise modules
    python -c "
import sys
sys.path.append('analyzer/enterprise/supply_chain')
from sbom_generator import CycloneDXGenerator
from vulnerability_scanner import VulnerabilityScanner
import json
from datetime import datetime

# Initialize generators
sbom_gen = CycloneDXGenerator()
vuln_scanner = VulnerabilityScanner()

# Configure generation options
config = {
    'include_dev_dependencies': '$include_dev' == 'true',
    'vulnerability_correlation': '$vulnerability_correlation' == 'true',
    'include_licenses': True,
    'include_hashes': True,
    'include_provenance': True,
    'cryptographic_signing': '$sign_flag' == 'true'
}

# Discover dependencies
dependencies = sbom_gen.discover_all_dependencies('.', config)
print(f'Discovered {len(dependencies[\"direct\"])} direct and {len(dependencies[\"transitive\"])} transitive dependencies')

# Perform vulnerability correlation if requested
vulnerabilities = {}
if config['vulnerability_correlation']:
    print('Performing vulnerability correlation...')
    vulnerabilities = vuln_scanner.correlate_vulnerabilities(dependencies)
    print(f'Found {vulnerabilities[\"summary\"][\"total_vulnerabilities\"]} vulnerabilities')

# Generate CycloneDX SBOM
cyclonedx_sbom = sbom_gen.generate_cyclonedx(dependencies, vulnerabilities, config)

# Add metadata
cyclonedx_sbom['metadata'] = {
    'timestamp': datetime.utcnow().isoformat() + 'Z',
    'tools': [
        {
            'name': 'SPEK-Enterprise-SBOM-Generator',
            'version': '2.0.0',
            'vendor': 'SPEK Enterprise Platform'
        }
    ],
    'component': {
        'type': 'application',
        'name': cyclonedx_sbom.get('project_name', 'SPEK-Project'),
        'version': cyclonedx_sbom.get('project_version', '1.0.0')
    }
}

# Write SBOM to file
with open('$output_file.json', 'w') as f:
    json.dump(cyclonedx_sbom, f, indent=2)

# Generate cryptographic signature if requested
if config['cryptographic_signing']:
    from crypto_signer import SBOMSigner
    signer = SBOMSigner()
    signature = signer.sign_sbom('$output_file.json')

    with open('$output_file.sig', 'w') as f:
        f.write(signature)

    print('SBOM signed with cryptographic signature')

print(f'CycloneDX SBOM generated: $output_file.json')
if config['cryptographic_signing']:
    print(f'Signature file: $output_file.sig')
    "

    # Validate SBOM format
    if command -v cyclone-dx-validator >/dev/null 2>&1; then
        echo "Validating CycloneDX SBOM format..."
        cyclone-dx-validator "$output_file.json" || echo "WARNING: SBOM validation failed"
    fi

    return 0
}
```

### 5. SBOM Generation (SPDX Format)

#### SPDX SBOM Generation:
```javascript
function generateSPDXSBOM(dependencies, vulnerabilities, config) {
  const spdxDocument = {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: config.project_name || "SPEK Enterprise Project",
    documentNamespace: `https://spek.enterprise.com/spdx/${generateUUID()}`,
    creationInfo: {
      created: new Date().toISOString(),
      creators: ["Tool: SPEK-Enterprise-SBOM-Generator-2.0.0"],
      licenseListVersion: "3.21"
    },
    packages: [],
    relationships: [],
    vulnerabilities: []
  };

  // Add root package
  const rootPackage = {
    SPDXID: "SPDXRef-Package-Root",
    name: config.project_name || "SPEK-Project",
    downloadLocation: "NOASSERTION",
    filesAnalyzed: false,
    licenseConcluded: "NOASSERTION",
    licenseDeclared: "NOASSERTION",
    copyrightText: "NOASSERTION",
    supplier: config.project_supplier || "NOASSERTION"
  };
  spdxDocument.packages.push(rootPackage);

  // Process direct dependencies
  let packageIndex = 1;
  for (const dep of dependencies.direct) {
    const packageId = `SPDXRef-Package-${packageIndex++}`;

    const spdxPackage = {
      SPDXID: packageId,
      name: dep.name,
      version: dep.version,
      downloadLocation: dep.repository || "NOASSERTION",
      filesAnalyzed: false,
      licenseConcluded: dep.license || "NOASSERTION",
      licenseDeclared: dep.license || "NOASSERTION",
      copyrightText: dep.copyright || "NOASSERTION",
      supplier: dep.supplier || "NOASSERTION",
      homepage: dep.homepage || "NOASSERTION"
    };

    // Add package hashes if available
    if (dep.hashes && dep.hashes.sha256) {
      spdxPackage.checksums = [{
        algorithm: "SHA256",
        checksumValue: dep.hashes.sha256
      }];
    }

    // Add external references
    if (dep.repository || dep.homepage) {
      spdxPackage.externalRefs = [];

      if (dep.repository) {
        spdxPackage.externalRefs.push({
          referenceCategory: "PACKAGE-MANAGER",
          referenceType: "purl",
          referenceLocator: generatePURL(dep)
        });
      }
    }

    spdxDocument.packages.push(spdxPackage);

    // Add dependency relationship
    spdxDocument.relationships.push({
      spdxElementId: "SPDXRef-Package-Root",
      relationshipType: "DEPENDS_ON",
      relatedSpdxElement: packageId
    });
  }

  // Add vulnerability information
  if (vulnerabilities && vulnerabilities.critical.length > 0) {
    for (const vuln of vulnerabilities.critical) {
      spdxDocument.vulnerabilities.push({
        id: vuln.vulnerability.id,
        name: vuln.vulnerability.title,
        description: vuln.vulnerability.description,
        severity: "CRITICAL",
        source: vuln.vulnerability.source,
        affects: [`SPDXRef-Package-${vuln.component}`],
        created: vuln.vulnerability.published || new Date().toISOString()
      });
    }
  }

  return spdxDocument;
}
```

### 6. Comprehensive SBOM Output

Sample CycloneDX SBOM with vulnerability correlation:

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "serialNumber": "urn:uuid:12345678-1234-1234-1234-123456789abc",
  "version": 1,
  "metadata": {
    "timestamp": "2024-09-14T17:00:00Z",
    "tools": [
      {
        "name": "SPEK-Enterprise-SBOM-Generator",
        "version": "2.0.0",
        "vendor": "SPEK Enterprise Platform"
      }
    ],
    "component": {
      "type": "application",
      "bom-ref": "spek-enterprise-project",
      "name": "SPEK Enterprise Project",
      "version": "1.0.0",
      "description": "Enterprise development platform with AI agents",
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ]
    }
  },

  "components": [
    {
      "type": "library",
      "bom-ref": "pkg:npm/express@4.18.2",
      "name": "express",
      "version": "4.18.2",
      "description": "Fast, unopinionated, minimalist web framework",
      "scope": "required",
      "hashes": [
        {
          "alg": "SHA-256",
          "content": "5d2f16c9c81b5fb9ccd4c7b3b5c4f3e2d1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
        }
      ],
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ],
      "purl": "pkg:npm/express@4.18.2",
      "externalReferences": [
        {
          "type": "website",
          "url": "https://expressjs.com/"
        },
        {
          "type": "vcs",
          "url": "git+https://github.com/expressjs/express.git"
        }
      ],
      "supplier": {
        "name": "Express contributors",
        "url": "https://github.com/expressjs/express"
      }
    },

    {
      "type": "library",
      "bom-ref": "pkg:npm/lodash@4.17.20",
      "name": "lodash",
      "version": "4.17.20",
      "description": "Lodash modular utilities",
      "scope": "required",
      "hashes": [
        {
          "alg": "SHA-256",
          "content": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
        }
      ],
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ],
      "purl": "pkg:npm/lodash@4.17.20"
    }
  ],

  "services": [
    {
      "bom-ref": "spek-api-service",
      "name": "SPEK API Service",
      "version": "1.0.0",
      "description": "Main API service for SPEK platform",
      "endpoints": [
        "https://api.spek.enterprise.com/v1"
      ],
      "authenticated": true,
      "x-trust-boundary": true
    }
  ],

  "dependencies": [
    {
      "ref": "spek-enterprise-project",
      "dependsOn": [
        "pkg:npm/express@4.18.2",
        "pkg:npm/lodash@4.17.20"
      ]
    }
  ],

  "vulnerabilities": [
    {
      "bom-ref": "vuln-lodash-prototype-pollution",
      "id": "CVE-2021-23337",
      "source": {
        "name": "NVD",
        "url": "https://nvd.nist.gov/vuln/detail/CVE-2021-23337"
      },
      "ratings": [
        {
          "source": {
            "name": "NVD"
          },
          "score": 7.2,
          "severity": "high",
          "method": "CVSSv3",
          "vector": "CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H"
        }
      ],
      "cwes": [79],
      "description": "Lodash versions prior to 4.17.21 are vulnerable to Command Injection via template.",
      "published": "2021-02-15T13:15:00Z",
      "updated": "2021-02-23T21:15:00Z",
      "affects": [
        {
          "ref": "pkg:npm/lodash@4.17.20"
        }
      ],
      "recommendation": "Upgrade to lodash 4.17.21 or later"
    }
  ],

  "annotations": [
    {
      "bom-ref": "spek-enterprise-project",
      "annotationType": "review",
      "annotator": "SPEK-Security-Team",
      "timestamp": "2024-09-14T17:00:00Z",
      "text": "SBOM reviewed and approved for production deployment",
      "signature": {
        "algorithm": "RS256",
        "value": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
      }
    }
  ]
}
```

## Integration Points

### Used by:
- Supply chain security assessments
- Compliance audit preparations (SOC2, ISO27001, NIST SSDF)
- SLSA provenance generation
- Vulnerability management workflows

### Produces:
- CycloneDX SBOM files (JSON format)
- SPDX SBOM files (JSON format)
- Cryptographic signatures for SBOM authenticity
- Vulnerability correlation reports

### Consumes:
- Project dependency files (package.json, requirements.txt, etc.)
- Package manager lock files
- Vulnerability databases (NVD, OSV, Snyk, GitHub Advisory)
- Enterprise cryptographic signing keys

## Error Handling

- Graceful handling of unsupported package managers
- Fallback to basic SBOM when vulnerability correlation fails
- Clear reporting of dependency discovery failures
- Validation of SBOM format compliance

## Performance Requirements

- SBOM generation completed within 2 minutes for medium projects
- Memory usage under 512MB during generation
- Support for projects with 10,000+ dependencies
- Performance overhead <=1.2% during dependency analysis

This command provides comprehensive SBOM generation with vulnerability correlation, cryptographic signing, and multi-format support for enterprise supply chain security management.
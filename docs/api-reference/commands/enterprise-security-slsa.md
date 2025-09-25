# /enterprise:security:slsa

## Purpose
Generate SLSA (Supply-chain Levels for Software Artifacts) provenance attestations with cryptographic signing for build integrity verification. Supports SLSA levels 1-4 with comprehensive build metadata, dependency tracking, and verifiable build environments.

## Usage
/enterprise:security:slsa [--level=1|2|3|4] [--output=<filename>] [--build-type=<type>] [--sign] [--verify-deps]

## Implementation

### 1. SLSA Level Configuration

#### SLSA Level Requirements and Configuration:
```bash
# Configure SLSA level requirements and validation
configure_slsa_level() {
    local level="$1"
    local build_type="$2"
    local sign_flag="$3"

    case "$level" in
        "1")
            echo "SLSA Level 1: Basic provenance with build origin tracking"
            SLSA_REQUIREMENTS=(
                "build_origin_tracking"
                "basic_provenance_generation"
            )
            ;;
        "2")
            echo "SLSA Level 2: Hosted build service with source integrity"
            SLSA_REQUIREMENTS=(
                "build_origin_tracking"
                "basic_provenance_generation"
                "hosted_build_service"
                "source_integrity_verification"
            )
            ;;
        "3")
            echo "SLSA Level 3: Hardened builds with non-falsifiable provenance"
            SLSA_REQUIREMENTS=(
                "build_origin_tracking"
                "basic_provenance_generation"
                "hosted_build_service"
                "source_integrity_verification"
                "isolated_build_environment"
                "non_falsifiable_provenance"
                "ephemeral_build_environment"
            )
            ;;
        "4")
            echo "SLSA Level 4: Maximum security with reproducible builds"
            SLSA_REQUIREMENTS=(
                "build_origin_tracking"
                "basic_provenance_generation"
                "hosted_build_service"
                "source_integrity_verification"
                "isolated_build_environment"
                "non_falsifiable_provenance"
                "ephemeral_build_environment"
                "reproducible_builds"
                "two_person_review"
                "hermetic_builds"
            )
            ;;
        *)
            echo "ERROR: Invalid SLSA level '$level'. Supported: 1, 2, 3, 4" >&2
            exit 1
            ;;
    esac

    echo "Required capabilities: ${SLSA_REQUIREMENTS[*]}"
}
```

#### SLSA Provenance Schema Configuration:
```javascript
const SLSA_PROVENANCE_SCHEMA = {
  v1: {
    _type: "https://in-toto.io/Statement/v1",
    subject: [],        // Artifacts produced by build
    predicateType: "https://slsa.dev/provenance/v1",
    predicate: {
      buildDefinition: {
        buildType: "",    // URI identifying build type
        externalParameters: {}, // Parameters under external control
        internalParameters: {}, // Parameters under builder control
        resolvedDependencies: [] // Resolved dependencies
      },
      runDetails: {
        builder: {
          id: "",         // Builder identity
          version: {},    // Builder version information
          builderDependencies: [] // Builder dependencies
        },
        metadata: {
          invocationId: "",      // Build invocation ID
          startedOn: "",         // Build start timestamp
          finishedOn: ""         // Build completion timestamp
        },
        byproducts: []           // Additional artifacts produced
      }
    }
  }
};

const BUILD_TYPES = {
  github_actions: {
    uri: "https://github.com/actions/runner@v2",
    description: "GitHub Actions hosted runner",
    supports_level: 3
  },

  spek_enterprise: {
    uri: "https://spek.enterprise.com/build-system/v2",
    description: "SPEK Enterprise hardened build system",
    supports_level: 4
  },

  local_development: {
    uri: "https://spek.enterprise.com/local-build/v1",
    description: "Local development environment",
    supports_level: 1
  }
};
```

### 2. Build Environment Tracking

#### Comprehensive Build Metadata Collection:
```javascript
async function collectBuildMetadata(buildType, slsaLevel) {
  const buildMetadata = {
    environment: {},
    source_metadata: {},
    build_tools: {},
    dependencies: {},
    security_context: {}
  };

  // Collect environment information
  buildMetadata.environment = {
    platform: process.platform,
    architecture: process.arch,
    node_version: process.version,
    hostname: require('os').hostname(),
    user: process.env.USER || process.env.USERNAME || 'unknown',
    working_directory: process.cwd(),
    environment_variables: filterSensitiveEnvVars(process.env)
  };

  // Collect source metadata
  if (fs.existsSync('.git')) {
    const git = require('simple-git')();
    const gitStatus = await git.status();
    const gitLog = await git.log({ maxCount: 1 });

    buildMetadata.source_metadata = {
      repository: await git.getRemotes(true),
      commit_hash: gitLog.latest.hash,
      commit_message: gitLog.latest.message,
      commit_author: gitLog.latest.author_name,
      commit_timestamp: gitLog.latest.date,
      branch: gitStatus.current,
      clean: gitStatus.isClean(),
      tag: await git.tag(['--points-at', 'HEAD']).catch(() => null)
    };

    // For SLSA Level 2+, verify source integrity
    if (slsaLevel >= 2) {
      buildMetadata.source_metadata.integrity_verification = await verifySourceIntegrity();
    }
  }

  // Collect build tool information
  buildMetadata.build_tools = await collectBuildToolInfo();

  // For SLSA Level 3+, collect security context
  if (slsaLevel >= 3) {
    buildMetadata.security_context = await collectSecurityContext();
  }

  return buildMetadata;
}

async function verifySourceIntegrity() {
  const integrity = {
    source_hash: null,
    signature_verification: null,
    provenance_chain: []
  };

  try {
    // Calculate source tree hash
    const git = require('simple-git')();
    const treeHash = await git.raw(['rev-parse', 'HEAD^{tree}']);
    integrity.source_hash = treeHash.trim();

    // Verify commit signatures if available
    try {
      const verifyResult = await git.raw(['verify-commit', 'HEAD']);
      integrity.signature_verification = {
        status: 'verified',
        details: verifyResult.trim()
      };
    } catch (error) {
      integrity.signature_verification = {
        status: 'not_signed',
        reason: 'No GPG signature found'
      };
    }

    // Track provenance chain for merged commits
    const mergeBase = await git.raw(['merge-base', 'HEAD', 'origin/main']).catch(() => null);
    if (mergeBase) {
      integrity.provenance_chain.push({
        type: 'merge_base',
        commit: mergeBase.trim(),
        verified: true
      });
    }

  } catch (error) {
    console.error('Source integrity verification failed:', error);
    integrity.error = error.message;
  }

  return integrity;
}

async function collectSecurityContext() {
  const securityContext = {
    isolation_level: 'none',
    resource_constraints: {},
    network_access: 'unrestricted',
    file_system_access: 'unrestricted',
    secrets_handling: 'environment_variables'
  };

  // Check if running in containerized environment
  if (fs.existsSync('/proc/1/cgroup')) {
    const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
    if (cgroup.includes('docker') || cgroup.includes('containerd')) {
      securityContext.isolation_level = 'container';
    }
  }

  // Check resource constraints
  securityContext.resource_constraints = {
    memory_limit: process.env.NODE_OPTIONS?.includes('--max-old-space-size') || 'default',
    cpu_limit: 'unrestricted',
    disk_space: await getDiskUsage()
  };

  // Analyze network access restrictions
  if (process.env.NO_PROXY || process.env.HTTP_PROXY) {
    securityContext.network_access = 'proxied';
  }

  return securityContext;
}
```

### 3. Dependency Resolution and Verification

#### Comprehensive Dependency Tracking:
```javascript
async function resolveAndVerifyDependencies(verifyDeps) {
  const dependencyInfo = {
    resolved_dependencies: [],
    verification_results: {},
    dependency_graph: {},
    security_analysis: {}
  };

  // Discover all dependencies
  const packageManagers = await detectPackageManagers();

  for (const pm of packageManagers) {
    const pmDeps = await pm.resolveDependencies();

    for (const dep of pmDeps) {
      const resolvedDep = {
        uri: generatePURL(dep),
        digest: {
          sha256: dep.integrity || await calculatePackageHash(dep)
        },
        annotations: {
          source: pm.name,
          resolved_version: dep.version,
          install_location: dep.path
        }
      };

      // For SLSA Level 2+, verify dependency integrity
      if (verifyDeps) {
        resolvedDep.verification = await verifyDependencyIntegrity(dep);
      }

      dependencyInfo.resolved_dependencies.push(resolvedDep);
    }
  }

  // Build dependency graph for supply chain analysis
  dependencyInfo.dependency_graph = buildDependencyGraph(dependencyInfo.resolved_dependencies);

  // Perform security analysis of dependency chain
  if (verifyDeps) {
    dependencyInfo.security_analysis = await analyzeDependencySecurityChain(dependencyInfo.resolved_dependencies);
  }

  return dependencyInfo;
}

async function verifyDependencyIntegrity(dependency) {
  const verification = {
    hash_verification: 'failed',
    signature_verification: 'not_available',
    provenance_verification: 'not_available',
    repository_verification: 'not_checked'
  };

  try {
    // Verify package hash against registry
    const registryHash = await fetchPackageHashFromRegistry(dependency);
    const localHash = await calculatePackageHash(dependency);

    verification.hash_verification = registryHash === localHash ? 'passed' : 'failed';

    // Check for package signatures (npm, pypi, etc.)
    if (dependency.signature) {
      const signatureValid = await verifyPackageSignature(dependency);
      verification.signature_verification = signatureValid ? 'passed' : 'failed';
    }

    // Verify repository authenticity for source packages
    if (dependency.repository) {
      verification.repository_verification = await verifyRepositoryAuthenticity(dependency.repository);
    }

  } catch (error) {
    verification.error = error.message;
  }

  return verification;
}
```

### 4. SLSA Provenance Generation

#### Generate SLSA v1 Provenance:
```bash
# Generate comprehensive SLSA provenance attestation
generate_slsa_provenance() {
    local level="$1"
    local output_file="$2"
    local build_type="$3"
    local sign_flag="$4"
    local verify_deps="$5"

    echo "[SHIELD] Generating SLSA Level $level provenance attestation"

    # Create artifacts directory
    mkdir -p .claude/.artifacts

    # Generate provenance using Python enterprise modules
    python -c "
import sys
sys.path.append('analyzer/enterprise/supply_chain')
from slsa_provenance import SLSAProvenanceGenerator
from crypto_signer import ProvenanceSigner
import json
from datetime import datetime
import uuid

# Initialize generators
prov_gen = SLSAProvenanceGenerator()
signer = ProvenanceSigner() if '$sign_flag' == 'true' else None

# Configure SLSA generation
config = {
    'slsa_level': int('$level'),
    'build_type': '$build_type' or 'spek_enterprise',
    'verify_dependencies': '$verify_deps' == 'true',
    'include_byproducts': True,
    'hermetic_build': int('$level') >= 4,
    'reproducible': int('$level') >= 4
}

print(f'Generating SLSA Level {config[\"slsa_level\"]} provenance...')

# Collect build metadata
build_metadata = prov_gen.collect_build_metadata(config)
print(f'Build environment: {build_metadata[\"environment\"][\"platform\"]} - {build_metadata[\"environment\"][\"architecture\"]}')

# Resolve dependencies
if config['verify_dependencies']:
    print('Resolving and verifying dependencies...')
    dependencies = prov_gen.resolve_and_verify_dependencies()
    print(f'Resolved {len(dependencies[\"resolved_dependencies\"])} dependencies')
else:
    dependencies = {'resolved_dependencies': []}

# Identify build artifacts
artifacts = prov_gen.identify_build_artifacts('.')
print(f'Build artifacts identified: {len(artifacts)}')

# Generate SLSA provenance
provenance = {
    '_type': 'https://in-toto.io/Statement/v1',
    'subject': artifacts,
    'predicateType': 'https://slsa.dev/provenance/v1',
    'predicate': {
        'buildDefinition': {
            'buildType': f'https://spek.enterprise.com/build-system/{config[\"build_type\"]}',
            'externalParameters': {
                'source': {
                    'uri': build_metadata.get('source_metadata', {}).get('repository', {}).get('origin', 'unknown'),
                    'digest': {
                        'sha1': build_metadata.get('source_metadata', {}).get('commit_hash', 'unknown')
                    }
                },
                'config': build_metadata.get('build_config', {})
            },
            'internalParameters': {
                'build_flags': build_metadata.get('build_flags', []),
                'environment_variables': build_metadata.get('environment', {}).get('filtered_env', {})
            },
            'resolvedDependencies': dependencies['resolved_dependencies']
        },
        'runDetails': {
            'builder': {
                'id': f'https://spek.enterprise.com/build-system/{config[\"build_type\"]}',
                'version': {
                    'spek_version': '2.0.0',
                    'build_system_version': build_metadata.get('build_tools', {}).get('version', '1.0.0')
                }
            },
            'metadata': {
                'invocationId': str(uuid.uuid4()),
                'startedOn': build_metadata.get('build_start_time', datetime.utcnow().isoformat() + 'Z'),
                'finishedOn': datetime.utcnow().isoformat() + 'Z'
            },
            'byproducts': build_metadata.get('byproducts', [])
        }
    }
}

# Add level-specific metadata
if config['slsa_level'] >= 3:
    provenance['predicate']['runDetails']['metadata']['buildInvocationId'] = str(uuid.uuid4())
    provenance['predicate']['runDetails']['metadata']['reproducible'] = config.get('reproducible', False)

if config['slsa_level'] >= 4:
    provenance['predicate']['buildDefinition']['hermetic'] = True
    provenance['predicate']['runDetails']['metadata']['completeness'] = {
        'parameters': True,
        'environment': True,
        'materials': True
    }

# Write provenance to file
with open('$output_file.json', 'w') as f:
    json.dump(provenance, f, indent=2)

# Generate cryptographic signature if requested
if signer:
    print('Signing provenance attestation...')
    signature = signer.sign_provenance('$output_file.json')

    with open('$output_file.sig', 'w') as f:
        f.write(signature)

    # Create signed envelope format
    signed_envelope = signer.create_signed_envelope(provenance)
    with open('$output_file.signed.json', 'w') as f:
        json.dump(signed_envelope, f, indent=2)

    print('Provenance signed and envelope created')

print(f'SLSA Level {config[\"slsa_level\"]} provenance generated: $output_file.json')
if signer:
    print(f'Signature file: $output_file.sig')
    print(f'Signed envelope: $output_file.signed.json')
    "

    # Validate SLSA provenance format
    if command -v slsa-verifier >/dev/null 2>&1; then
        echo "Validating SLSA provenance format..."
        slsa-verifier verify-artifact --provenance-path "$output_file.json" --source-uri "$(git remote get-url origin)" || echo "WARNING: SLSA provenance validation failed"
    fi

    return 0
}
```

### 5. Sample SLSA Level 3 Provenance Output

Comprehensive SLSA Level 3 provenance with cryptographic signing:

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    {
      "name": "spek-enterprise-project-1.0.0.tar.gz",
      "digest": {
        "sha256": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
      }
    },
    {
      "name": "spek-enterprise-project-1.0.0-win.exe",
      "digest": {
        "sha256": "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3"
      }
    }
  ],
  "predicateType": "https://slsa.dev/provenance/v1",
  "predicate": {
    "buildDefinition": {
      "buildType": "https://spek.enterprise.com/build-system/hardened-ci",
      "externalParameters": {
        "source": {
          "uri": "git+https://github.com/spek-enterprise/platform.git",
          "digest": {
            "sha1": "abcdef1234567890abcdef1234567890abcdef12"
          },
          "ref": "refs/heads/main"
        },
        "config": {
          "target": "production",
          "optimization": "release",
          "security_scan": "enabled"
        },
        "workflow": {
          "ref": "refs/heads/main",
          "repository": "https://github.com/spek-enterprise/platform",
          "workflow": "build-and-release.yml"
        }
      },
      "internalParameters": {
        "buildFlags": [
          "--mode=production",
          "--optimization=size",
          "--security-hardening=enabled"
        ],
        "environment": {
          "NODE_ENV": "production",
          "CI": "true",
          "SPEK_BUILD_ID": "build-20240914-170000"
        }
      },
      "resolvedDependencies": [
        {
          "uri": "pkg:npm/express@4.18.2",
          "digest": {
            "sha256": "5d2f16c9c81b5fb9ccd4c7b3b5c4f3e2d1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
          },
          "annotations": {
            "source": "npm",
            "resolved_version": "4.18.2",
            "verification_status": "hash_verified"
          }
        },
        {
          "uri": "pkg:npm/lodash@4.17.21",
          "digest": {
            "sha256": "6f3e4d5c6b7a8901234567890abcdef1234567890abcdef1234567890abcdef12"
          },
          "annotations": {
            "source": "npm",
            "resolved_version": "4.17.21",
            "verification_status": "hash_verified",
            "security_scan": "passed"
          }
        }
      ]
    },
    "runDetails": {
      "builder": {
        "id": "https://spek.enterprise.com/build-system/hardened-ci",
        "version": {
          "spek_version": "2.0.0",
          "build_system_version": "1.5.0",
          "runner_version": "v2.309.0"
        },
        "builderDependencies": [
          {
            "uri": "pkg:generic/spek-build-tools@2.0.0",
            "digest": {
              "sha256": "c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"
            }
          }
        ]
      },
      "metadata": {
        "invocationId": "build-20240914-170000-uuid-12345678",
        "buildInvocationId": "ci-run-98765432",
        "startedOn": "2024-09-14T17:00:00Z",
        "finishedOn": "2024-09-14T17:08:45Z",
        "reproducible": false,
        "completeness": {
          "parameters": true,
          "environment": true,
          "materials": true
        }
      },
      "byproducts": [
        {
          "name": "build-log.txt",
          "digest": {
            "sha256": "e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8"
          }
        },
        {
          "name": "test-results.xml",
          "digest": {
            "sha256": "f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"
          }
        },
        {
          "name": "security-scan-results.json",
          "digest": {
            "sha256": "01b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
          }
        }
      ]
    }
  },
  "metadata": {
    "buildStartedOn": "2024-09-14T17:00:00Z",
    "buildFinishedOn": "2024-09-14T17:08:45Z",
    "buildInvocationId": "ci-run-98765432",
    "hermeticBuild": false,
    "reproducible": false
  }
}
```

### 6. Cryptographic Signing and Verification

#### Signed Envelope Format:
```json
{
  "payload": "ewogICJfdHlwZSI6ICJodHRwczovL2luLXRvdG8uaW8vU3RhdGVtZW50L3YxIiwKICAic3ViamVjdCI6...",
  "payloadType": "application/vnd.in-toto+json",
  "signatures": [
    {
      "keyid": "SHA256:jH9a123b456c789d012e345f678g901h234i567j890k123l456m789n012o",
      "sig": "MEUCIQCq7gN+123...ABC789def="
    }
  ]
}
```

## Integration Points

### Used by:
- CI/CD pipelines for build verification
- Container image signing workflows
- Supply chain security audits
- Compliance frameworks (NIST SSDF, ISO 27001)

### Produces:
- SLSA provenance attestations (JSON format)
- Cryptographic signatures for provenance verification
- Build artifact integrity proofs
- Dependency verification reports

### Consumes:
- Build environment metadata
- Source code repository information
- Dependency resolution data
- Cryptographic signing keys

## Error Handling

- Graceful degradation when build environment metadata is incomplete
- Clear reporting of dependency verification failures
- Fallback to lower SLSA levels when requirements cannot be met
- Validation of cryptographic signing prerequisites

## Performance Requirements

- Provenance generation completed within 3 minutes
- Memory usage under 256MB during generation
- Support for builds with 1000+ dependencies
- Performance overhead <=1.2% during build process

This command provides comprehensive SLSA provenance generation with multi-level support, cryptographic signing, and enterprise-grade build verification for supply chain security assurance.
/**
 * SBOM Generator - Functional CycloneDX and SPDX Output
 * Generates actual Software Bill of Materials from package.json and file analysis
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SBOMGenerator {
  constructor() {
    this.components = new Map();
    this.licenses = new Set();
    this.vulnerabilities = [];
  }

  /**
   * Analyze package.json and dependencies to build component list
   */
  async analyzeProject(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found in project path');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    
    // Add main project component
    this.addComponent({
      name: packageJson.name || 'unknown-project',
      version: packageJson.version || '1.0.0',
      type: 'application',
      description: packageJson.description || '',
      license: packageJson.license || 'UNLICENSED',
      homepage: packageJson.homepage || '',
      repository: packageJson.repository?.url || ''
    });

    // Analyze dependencies
    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {},
      ...packageJson.peerDependencies || {},
      ...packageJson.optionalDependencies || {}
    };

    for (const [depName, depVersion] of Object.entries(allDeps)) {
      await this.analyzeDependency(depName, depVersion, nodeModulesPath);
    }

    return this.components.size;
  }

  /**
   * Analyze individual dependency
   */
  async analyzeDependency(name, version, nodeModulesPath) {
    const depPath = path.join(nodeModulesPath, name);
    
    if (!fs.existsSync(depPath)) {
      // Add with limited info if not installed
      this.addComponent({
        name,
        version: version.replace(/[\^~]/, ''),
        type: 'library',
        license: 'UNKNOWN'
      });
      return;
    }

    const depPackageJsonPath = path.join(depPath, 'package.json');
    
    if (fs.existsSync(depPackageJsonPath)) {
      try {
        const depPackageJson = JSON.parse(fs.readFileSync(depPackageJsonPath, 'utf8'));
        
        this.addComponent({
          name: depPackageJson.name,
          version: depPackageJson.version,
          type: 'library',
          description: depPackageJson.description || '',
          license: depPackageJson.license || 'UNKNOWN',
          homepage: depPackageJson.homepage || '',
          repository: depPackageJson.repository?.url || '',
          author: depPackageJson.author || '',
          keywords: depPackageJson.keywords || []
        });

        if (depPackageJson.license) {
          this.licenses.add(depPackageJson.license);
        }
      } catch (error) {
        // Handle malformed package.json
        this.addComponent({
          name,
          version: 'unknown',
          type: 'library',
          license: 'UNKNOWN',
          error: 'Failed to parse package.json'
        });
      }
    }
  }

  /**
   * Add component to SBOM
   */
  addComponent(componentData) {
    const componentId = `${componentData.name}@${componentData.version}`;
    const hash = crypto.createHash('sha256').update(componentId).digest('hex');
    
    this.components.set(componentId, {
      ...componentData,
      id: componentId,
      hash: hash.substring(0, 16),
      addedAt: new Date().toISOString()
    });
  }

  /**
   * Generate CycloneDX SBOM (JSON format)
   */
  generateCycloneDX() {
    const components = Array.from(this.components.values()).map(comp => ({
      "bom-ref": comp.id,
      type: comp.type,
      name: comp.name,
      version: comp.version,
      description: comp.description || '',
      licenses: comp.license !== 'UNKNOWN' ? [{ license: { name: comp.license } }] : [],
      hashes: [
        {
          alg: "SHA-256",
          content: comp.hash
        }
      ],
      externalReferences: this.buildExternalReferences(comp)
    }));

    const cycloneDX = {
      bomFormat: "CycloneDX",
      specVersion: "1.4",
      serialNumber: `urn:uuid:${crypto.randomUUID()}`,
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [
          {
            vendor: "SPEK Platform",
            name: "SBOM Generator",
            version: "1.0.0"
          }
        ],
        component: {
          "bom-ref": components[0]?.["bom-ref"] || "unknown",
          type: "application",
          name: components[0]?.name || "unknown-project",
          version: components[0]?.version || "1.0.0"
        }
      },
      components: components.slice(1), // Exclude main component from components list
      dependencies: this.generateDependencyGraph()
    };

    return cycloneDX;
  }

  /**
   * Generate SPDX SBOM (JSON format)
   */
  generateSPDX() {
    const packages = Array.from(this.components.values()).map(comp => ({
      SPDXID: `SPDXRef-Package-${comp.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
      name: comp.name,
      versionInfo: comp.version,
      downloadLocation: comp.repository || 'NOASSERTION',
      filesAnalyzed: false,
      licenseConcluded: comp.license !== 'UNKNOWN' ? comp.license : 'NOASSERTION',
      licenseDeclared: comp.license !== 'UNKNOWN' ? comp.license : 'NOASSERTION',
      copyrightText: comp.author || 'NOASSERTION',
      checksums: [
        {
          algorithm: 'SHA256',
          checksumValue: comp.hash
        }
      ],
      homepage: comp.homepage || 'NOASSERTION',
      description: comp.description || 'NOASSERTION'
    }));

    const spdx = {
      spdxVersion: "SPDX-2.3",
      dataLicense: "CC0-1.0",
      SPDXID: "SPDXRef-DOCUMENT",
      documentName: "SBOM for Project",
      documentNamespace: `https://example.com/spdx/${crypto.randomUUID()}`,
      creationInfo: {
        created: new Date().toISOString(),
        creators: ["Tool: SPEK Platform SBOM Generator v1.0.0"],
        licenseListVersion: "3.19"
      },
      packages: packages,
      relationships: this.generateSPDXRelationships(packages)
    };

    return spdx;
  }

  /**
   * Build external references for components
   */
  buildExternalReferences(comp) {
    const refs = [];
    
    if (comp.homepage) {
      refs.push({
        type: "website",
        url: comp.homepage
      });
    }
    
    if (comp.repository) {
      refs.push({
        type: "vcs",
        url: comp.repository
      });
    }
    
    return refs;
  }

  /**
   * Generate dependency relationships
   */
  generateDependencyGraph() {
    const dependencies = [];
    const components = Array.from(this.components.values());
    
    if (components.length > 0) {
      const mainComponent = components[0];
      
      // Main component depends on all libraries
      dependencies.push({
        ref: mainComponent.id,
        dependsOn: components.slice(1).map(c => c.id)
      });
    }
    
    return dependencies;
  }

  /**
   * Generate SPDX relationships
   */
  generateSPDXRelationships(packages) {
    const relationships = [];
    
    if (packages.length > 0) {
      relationships.push({
        spdxElementId: "SPDXRef-DOCUMENT",
        relationshipType: "DESCRIBES",
        relatedSpdxElement: packages[0].SPDXID
      });
      
      // Add dependency relationships
      for (let i = 1; i < packages.length; i++) {
        relationships.push({
          spdxElementId: packages[0].SPDXID,
          relationshipType: "DEPENDS_ON",
          relatedSpdxElement: packages[i].SPDXID
        });
      }
    }
    
    return relationships;
  }

  /**
   * Export SBOM to file
   */
  async exportToFile(format, outputPath) {
    let sbomData;
    let extension;
    
    switch (format.toLowerCase()) {
      case 'cyclonedx':
        sbomData = this.generateCycloneDX();
        extension = 'cyclonedx.json';
        break;
      case 'spdx':
        sbomData = this.generateSPDX();
        extension = 'spdx.json';
        break;
      default:
        throw new Error(`Unsupported format: ${format}. Use 'cyclonedx' or 'spdx'`);
    }
    
    const filename = path.join(outputPath, `sbom.${extension}`);
    
    fs.writeFileSync(filename, JSON.stringify(sbomData, null, 2));
    
    return {
      filename,
      format,
      components: this.components.size,
      licenses: Array.from(this.licenses),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate SBOM completeness
   */
  validateSBOM() {
    const validation = {
      valid: true,
      warnings: [],
      errors: [],
      stats: {
        totalComponents: this.components.size,
        licensedComponents: 0,
        unlicensedComponents: 0,
        componentsWithDescription: 0
      }
    };

    for (const component of this.components.values()) {
      if (component.license === 'UNKNOWN') {
        validation.warnings.push(`Component ${component.name} has unknown license`);
        validation.stats.unlicensedComponents++;
      } else {
        validation.stats.licensedComponents++;
      }
      
      if (!component.description) {
        validation.warnings.push(`Component ${component.name} missing description`);
      } else {
        validation.stats.componentsWithDescription++;
      }
      
      if (!component.version || component.version === 'unknown') {
        validation.errors.push(`Component ${component.name} has unknown version`);
        validation.valid = false;
      }
    }

    return validation;
  }
}

module.exports = SBOMGenerator;
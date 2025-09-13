/**
 * SBOM Generator - Working Example
 * Demonstrates functional CycloneDX and SPDX generation
 */

const fs = require('fs');
const path = require('path');
const SBOMGenerator = require('../src/sbom/generator');

async function demonstrateSBOM() {
  console.log('=== SBOM Generator Demonstration ===\n');
  
  const sbom = new SBOMGenerator();
  
  // Example 1: Manual Component Addition
  console.log('1. Manual Component Addition:');
  console.log('----------------------------');
  
  // Add application component
  sbom.addComponent({
    name: 'demo-application',
    version: '2.1.0',
    type: 'application',
    description: 'Demonstration application for SBOM generation',
    license: 'MIT',
    homepage: 'https://github.com/example/demo-app',
    repository: 'https://github.com/example/demo-app.git',
    author: 'Development Team'
  });
  
  // Add library dependencies
  const dependencies = [
    {
      name: 'express',
      version: '4.18.2',
      type: 'library',
      description: 'Fast, unopinionated, minimalist web framework for node',
      license: 'MIT',
      homepage: 'https://expressjs.com',
      repository: 'https://github.com/expressjs/express.git'
    },
    {
      name: 'lodash',
      version: '4.17.21',
      type: 'library',
      description: 'A modern JavaScript utility library delivering modularity, performance, & extras',
      license: 'MIT',
      homepage: 'https://lodash.com',
      repository: 'https://github.com/lodash/lodash.git'
    },
    {
      name: 'moment',
      version: '2.29.4',
      type: 'library',
      description: 'Parse, validate, manipulate, and display dates',
      license: 'MIT',
      homepage: 'https://momentjs.com',
      repository: 'https://github.com/moment/moment.git'
    },
    {
      name: 'jsonwebtoken',
      version: '9.0.0',
      type: 'library',
      description: 'JSON Web Token implementation (symmetric and asymmetric)',
      license: 'MIT',
      homepage: 'https://github.com/auth0/node-jsonwebtoken',
      repository: 'https://github.com/auth0/node-jsonwebtoken.git'
    },
    {
      name: 'bcrypt',
      version: '5.1.0',
      type: 'library',
      description: 'A bcrypt library for NodeJS',
      license: 'MIT',
      repository: 'https://github.com/kelektiv/node.bcrypt.js.git'
    }
  ];
  
  dependencies.forEach(dep => {
    sbom.addComponent(dep);
    console.log(`Added: ${dep.name}@${dep.version} (${dep.license})`);
  });
  
  console.log(`\nTotal components: ${sbom.components.size}`);
  console.log(`Licenses found: ${Array.from(sbom.licenses).join(', ')}\n`);
  
  // Example 2: Generate CycloneDX SBOM
  console.log('2. CycloneDX SBOM Generation:');
  console.log('----------------------------');
  
  const cycloneDX = sbom.generateCycloneDX();
  
  console.log(`BOM Format: ${cycloneDX.bomFormat}`);
  console.log(`Spec Version: ${cycloneDX.specVersion}`);
  console.log(`Serial Number: ${cycloneDX.serialNumber}`);
  console.log(`Components: ${cycloneDX.components.length}`);
  console.log(`Dependencies: ${cycloneDX.dependencies.length}`);
  console.log(`Tool: ${cycloneDX.metadata.tools[0].vendor} ${cycloneDX.metadata.tools[0].name}`);
  
  // Show first component details
  if (cycloneDX.components.length > 0) {
    const firstComponent = cycloneDX.components[0];
    console.log(`\nFirst Component: ${firstComponent.name}@${firstComponent.version}`);
    console.log(`  Type: ${firstComponent.type}`);
    console.log(`  Licenses: ${firstComponent.licenses.length > 0 ? firstComponent.licenses[0].license.name : 'None'}`);
    console.log(`  Hash: ${firstComponent.hashes[0].alg} - ${firstComponent.hashes[0].content}`);
    console.log(`  External References: ${firstComponent.externalReferences.length}`);
  }
  
  console.log('');
  
  // Example 3: Generate SPDX SBOM
  console.log('3. SPDX SBOM Generation:');
  console.log('-----------------------');
  
  const spdxDoc = sbom.generateSPDX();
  
  console.log(`SPDX Version: ${spdxDoc.spdxVersion}`);
  console.log(`Data License: ${spdxDoc.dataLicense}`);
  console.log(`Document Name: ${spdxDoc.documentName}`);
  console.log(`Document Namespace: ${spdxDoc.documentNamespace}`);
  console.log(`Packages: ${spdxDoc.packages.length}`);
  console.log(`Relationships: ${spdxDoc.relationships.length}`);
  console.log(`Created: ${spdxDoc.creationInfo.created}`);
  console.log(`Creators: ${spdxDoc.creationInfo.creators.join(', ')}`);
  
  // Show first package details
  if (spdxDoc.packages.length > 0) {
    const firstPackage = spdxDoc.packages[0];
    console.log(`\nFirst Package: ${firstPackage.name}@${firstPackage.versionInfo}`);
    console.log(`  SPDX ID: ${firstPackage.SPDXID}`);
    console.log(`  License Concluded: ${firstPackage.licenseConcluded}`);
    console.log(`  Download Location: ${firstPackage.downloadLocation}`);
    console.log(`  Checksum: ${firstPackage.checksums[0].algorithm} - ${firstPackage.checksums[0].checksumValue}`);
  }
  
  console.log('');
  
  // Example 4: SBOM Validation
  console.log('4. SBOM Validation:');
  console.log('------------------');
  
  const validation = sbom.validateSBOM();
  
  console.log(`Validation Status: ${validation.valid ? 'VALID' : 'INVALID'}`);
  console.log(`Total Components: ${validation.stats.totalComponents}`);
  console.log(`Licensed Components: ${validation.stats.licensedComponents}`);
  console.log(`Unlicensed Components: ${validation.stats.unlicensedComponents}`);
  console.log(`Components with Description: ${validation.stats.componentsWithDescription}`);
  
  if (validation.warnings.length > 0) {
    console.log(`\nWarnings (${validation.warnings.length}):`);
    validation.warnings.slice(0, 5).forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (validation.errors.length > 0) {
    console.log(`\nErrors (${validation.errors.length}):`);
    validation.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('');
  
  // Example 5: Export to Files
  console.log('5. Export SBOM to Files:');
  console.log('-----------------------');
  
  // Create output directory
  const outputDir = path.join(__dirname, 'sbom-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Export CycloneDX
    const cycloneDXResult = await sbom.exportToFile('cyclonedx', outputDir);
    console.log(`CycloneDX exported to: ${cycloneDXResult.filename}`);
    console.log(`  Format: ${cycloneDXResult.format}`);
    console.log(`  Components: ${cycloneDXResult.components}`);
    console.log(`  File size: ${fs.statSync(cycloneDXResult.filename).size} bytes`);
    
    // Export SPDX
    const spdxResult = await sbom.exportToFile('spdx', outputDir);
    console.log(`SPDX exported to: ${spdxResult.filename}`);
    console.log(`  Format: ${spdxResult.format}`);
    console.log(`  File size: ${fs.statSync(spdxResult.filename).size} bytes`);
    
    console.log(`\nBoth SBOMs available in: ${outputDir}`);
    
  } catch (error) {
    console.error(`Export error: ${error.message}`);
  }
  
  // Example 6: Analyze Real Project (if package.json exists)
  console.log('\n6. Real Project Analysis:');
  console.log('------------------------');
  
  const projectPath = path.resolve(__dirname, '..');
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    console.log(`Analyzing project at: ${projectPath}`);
    
    const realProjectSbom = new SBOMGenerator();
    
    try {
      const componentCount = await realProjectSbom.analyzeProject(projectPath);
      console.log(`Analyzed ${componentCount} components from package.json`);
      
      const realValidation = realProjectSbom.validateSBOM();
      console.log(`Real project validation: ${realValidation.valid ? 'VALID' : 'NEEDS ATTENTION'}`);
      
      if (componentCount > 0) {
        const realCycloneDX = realProjectSbom.generateCycloneDX();
        const realSPDX = realProjectSbom.generateSPDX();
        
        console.log(`Generated CycloneDX with ${realCycloneDX.components.length} components`);
        console.log(`Generated SPDX with ${realSPDX.packages.length} packages`);
        
        // Export real project SBOMs
        try {
          await realProjectSbom.exportToFile('cyclonedx', outputDir);
          await realProjectSbom.exportToFile('spdx', outputDir);
          console.log('Real project SBOMs exported successfully');
        } catch (exportError) {
          console.log(`Export warning: ${exportError.message}`);
        }
      }
      
    } catch (analysisError) {
      console.log(`Analysis error: ${analysisError.message}`);
    }
  } else {
    console.log('No package.json found in project root - skipping real project analysis');
    
    // Create a mock package.json for demonstration
    const mockPackageJson = {
      name: 'mock-project',
      version: '1.0.0',
      description: 'Mock project for SBOM demonstration',
      license: 'MIT',
      dependencies: {
        'axios': '^1.3.0',
        'chalk': '^5.0.0'
      },
      devDependencies: {
        'jest': '^29.0.0',
        'eslint': '^8.0.0'
      }
    };
    
    const mockProjectPath = path.join(outputDir, 'mock-project');
    if (!fs.existsSync(mockProjectPath)) {
      fs.mkdirSync(mockProjectPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(mockProjectPath, 'package.json'), 
      JSON.stringify(mockPackageJson, null, 2)
    );
    
    const mockSbom = new SBOMGenerator();
    const mockComponents = await mockSbom.analyzeProject(mockProjectPath);
    
    console.log(`Created mock project with ${mockComponents} components`);
    console.log('Mock project SBOMs:');
    
    const mockCycloneDX = await mockSbom.exportToFile('cyclonedx', outputDir);
    const mockSPDX = await mockSbom.exportToFile('spdx', outputDir);
    
    console.log(`  - ${mockCycloneDX.filename}`);
    console.log(`  - ${mockSPDX.filename}`);
  }
  
  console.log('\n=== SBOM Demonstration Complete ===');
  console.log(`\nAll generated files are available in: ${outputDir}`);
  console.log('You can inspect the generated CycloneDX and SPDX files to verify functionality.');
}

// Run the demonstration
if (require.main === module) {
  demonstrateSBOM().catch(console.error);
}

module.exports = { demonstrateSBOM };
/**
 * Unit Tests for SBOM Generator
 * Tests CycloneDX and SPDX generation functionality
 */

const fs = require('fs');
const path = require('path');
const SBOMGenerator = require('../src/sbom/generator');
const { cleanupTestResources } = require('./setup/test-environment');

describe('SBOMGenerator', () => {
  let sbom;
  let testProjectPath;

  beforeEach(() => {
    sbom = new SBOMGenerator();
    testProjectPath = path.join(__dirname, 'fixtures', 'test-project');

    // Create test fixtures directory structure
    if (!fs.existsSync(path.dirname(testProjectPath))) {
      fs.mkdirSync(path.dirname(testProjectPath), { recursive: true });
    }
    if (!fs.existsSync(testProjectPath)) {
      fs.mkdirSync(testProjectPath);
    }
  });

  afterEach(async () => {
    // Cleanup test fixtures
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }

    // Clean any temporary SBOM files that may have been created
    const possibleSbomPaths = [
      path.join(testProjectPath, 'sbom.cyclonedx.json'),
      path.join(testProjectPath, 'sbom.spdx.json'),
      path.join(__dirname, 'sbom.cyclonedx.json'),
      path.join(__dirname, 'sbom.spdx.json')
    ];

    possibleSbomPaths.forEach(sbomPath => {
      if (fs.existsSync(sbomPath)) {
        fs.unlinkSync(sbomPath);
      }
    });

    // Clean test resources (async cleanup)
    await cleanupTestResources();
  });

  describe('Component Management', () => {
    test('should add component correctly', () => {
      sbom.addComponent({
        name: 'test-package',
        version: '1.0.0',
        type: 'library',
        license: 'MIT'
      });

      expect(sbom.components.size).toBe(1);
      const component = sbom.components.get('test-package@1.0.0');
      expect(component.name).toBe('test-package');
      expect(component.version).toBe('1.0.0');
      expect(component.type).toBe('library');
      expect(component.license).toBe('MIT');
      expect(component.hash).toBeDefined();
      expect(component.addedAt).toBeDefined();
    });

    test('should generate unique hashes for different components', () => {
      sbom.addComponent({ name: 'package-a', version: '1.0.0', type: 'library', license: 'MIT' });
      sbom.addComponent({ name: 'package-b', version: '1.0.0', type: 'library', license: 'Apache-2.0' });

      const componentA = sbom.components.get('package-a@1.0.0');
      const componentB = sbom.components.get('package-b@1.0.0');
      
      expect(componentA.hash).not.toBe(componentB.hash);
    });
  });

  describe('Project Analysis', () => {
    test('should throw error when package.json not found', async () => {
      await expect(sbom.analyzeProject('/nonexistent/path')).rejects.toThrow('package.json not found in project path');
    });

    test('should analyze project with package.json', async () => {
      // Create test package.json
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project for SBOM generation',
        license: 'MIT',
        dependencies: {
          lodash: '^4.17.21',
          express: '^4.18.0'
        },
        devDependencies: {
          jest: '^29.0.0'
        }
      };

      fs.writeFileSync(path.join(testProjectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

      const componentCount = await sbom.analyzeProject(testProjectPath);
      
      expect(componentCount).toBe(4); // Main project + 3 dependencies
      expect(sbom.components.has('test-project@1.0.0')).toBe(true);
      expect(sbom.components.has('lodash@^4.17.21')).toBe(true);
      expect(sbom.components.has('express@^4.18.0')).toBe(true);
      expect(sbom.components.has('jest@^29.0.0')).toBe(true);
    });

    test('should handle malformed package.json gracefully', async () => {
      fs.writeFileSync(path.join(testProjectPath, 'package.json'), '{ invalid json');

      await expect(sbom.analyzeProject(testProjectPath)).rejects.toThrow();
    });

    test('should analyze installed dependencies when node_modules exists', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: { 'test-dep': '1.0.0' }
      };

      const nodeModulesPath = path.join(testProjectPath, 'node_modules', 'test-dep');
      const depPackageJson = {
        name: 'test-dep',
        version: '1.0.0',
        description: 'Test dependency',
        license: 'Apache-2.0',
        author: 'Test Author'
      };

      fs.writeFileSync(path.join(testProjectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
      fs.mkdirSync(nodeModulesPath, { recursive: true });
      fs.writeFileSync(path.join(nodeModulesPath, 'package.json'), JSON.stringify(depPackageJson, null, 2));

      await sbom.analyzeProject(testProjectPath);

      const dependency = sbom.components.get('test-dep@1.0.0');
      expect(dependency).toBeDefined();
      expect(dependency.description).toBe('Test dependency');
      expect(dependency.license).toBe('Apache-2.0');
      expect(dependency.author).toBe('Test Author');
    });
  });

  describe('CycloneDX Generation', () => {
    test('should generate valid CycloneDX SBOM', () => {
      sbom.addComponent({
        name: 'main-app',
        version: '1.0.0',
        type: 'application',
        description: 'Main application',
        license: 'MIT'
      });

      sbom.addComponent({
        name: 'lodash',
        version: '4.17.21',
        type: 'library',
        description: 'Utility library',
        license: 'MIT',
        homepage: 'https://lodash.com'
      });

      const cycloneDX = sbom.generateCycloneDX();

      expect(cycloneDX.bomFormat).toBe('CycloneDX');
      expect(cycloneDX.specVersion).toBe('1.4');
      expect(cycloneDX.serialNumber).toMatch(/^urn:uuid:/);
      expect(cycloneDX.metadata).toBeDefined();
      expect(cycloneDX.metadata.tools).toHaveLength(1);
      expect(cycloneDX.metadata.component.name).toBe('main-app');
      expect(cycloneDX.components).toHaveLength(1); // Excludes main component
      expect(cycloneDX.dependencies).toBeDefined();
      
      const lodashComponent = cycloneDX.components[0];
      expect(lodashComponent.name).toBe('lodash');
      expect(lodashComponent.version).toBe('4.17.21');
      expect(lodashComponent.hashes).toHaveLength(1);
      expect(lodashComponent.hashes[0].alg).toBe('SHA-256');
    });

    test('should include external references when available', () => {
      sbom.addComponent({
        name: 'test-lib',
        version: '1.0.0',
        type: 'library',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/test-lib'
      });

      const cycloneDX = sbom.generateCycloneDX();
      const component = cycloneDX.components[0];
      
      expect(component.externalReferences).toHaveLength(2);
      expect(component.externalReferences[0].type).toBe('website');
      expect(component.externalReferences[0].url).toBe('https://example.com');
      expect(component.externalReferences[1].type).toBe('vcs');
      expect(component.externalReferences[1].url).toBe('https://github.com/example/test-lib');
    });
  });

  describe('SPDX Generation', () => {
    test('should generate valid SPDX SBOM', () => {
      sbom.addComponent({
        name: 'main-app',
        version: '1.0.0',
        type: 'application',
        license: 'MIT',
        author: 'Test Author'
      });

      sbom.addComponent({
        name: 'express',
        version: '4.18.0',
        type: 'library',
        license: 'MIT',
        repository: 'https://github.com/expressjs/express'
      });

      const spdxDoc = sbom.generateSPDX();

      expect(spdxDoc.spdxVersion).toBe('SPDX-2.3');
      expect(spdxDoc.dataLicense).toBe('CC0-1.0');
      expect(spdxDoc.SPDXID).toBe('SPDXRef-DOCUMENT');
      expect(spdxDoc.documentNamespace).toMatch(/^https:\/\/example\.com\/spdx\//);
      expect(spdxDoc.creationInfo).toBeDefined();
      expect(spdxDoc.creationInfo.creators).toContain('Tool: SPEK Platform SBOM Generator v1.0.0');
      expect(spdxDoc.packages).toHaveLength(2);
      expect(spdxDoc.relationships).toBeDefined();

      const mainPackage = spdxDoc.packages[0];
      expect(mainPackage.SPDXID).toBe('SPDXRef-Package-main-app');
      expect(mainPackage.name).toBe('main-app');
      expect(mainPackage.versionInfo).toBe('1.0.0');
      expect(mainPackage.licenseConcluded).toBe('MIT');
      expect(mainPackage.checksums).toHaveLength(1);
      expect(mainPackage.checksums[0].algorithm).toBe('SHA256');
    });

    test('should handle unknown licenses correctly', () => {
      sbom.addComponent({
        name: 'unknown-license-lib',
        version: '1.0.0',
        type: 'library',
        license: 'UNKNOWN'
      });

      const spdxDoc = sbom.generateSPDX();
      const package = spdxDoc.packages[0];
      
      expect(package.licenseConcluded).toBe('NOASSERTION');
      expect(package.licenseDeclared).toBe('NOASSERTION');
    });
  });

  describe('Export Functionality', () => {
    test('should export CycloneDX to file', async () => {
      sbom.addComponent({
        name: 'test-app',
        version: '1.0.0',
        type: 'application',
        license: 'MIT'
      });

      const outputPath = testProjectPath;
      const result = await sbom.exportToFile('cyclonedx', outputPath);

      expect(result.filename).toBe(path.join(outputPath, 'sbom.cyclonedx.json'));
      expect(result.format).toBe('cyclonedx');
      expect(result.components).toBe(1);
      expect(fs.existsSync(result.filename)).toBe(true);

      const fileContent = JSON.parse(fs.readFileSync(result.filename, 'utf8'));
      expect(fileContent.bomFormat).toBe('CycloneDX');
    });

    test('should export SPDX to file', async () => {
      sbom.addComponent({
        name: 'test-app',
        version: '1.0.0',
        type: 'application',
        license: 'MIT'
      });

      const outputPath = testProjectPath;
      const result = await sbom.exportToFile('spdx', outputPath);

      expect(result.filename).toBe(path.join(outputPath, 'sbom.spdx.json'));
      expect(result.format).toBe('spdx');
      expect(fs.existsSync(result.filename)).toBe(true);

      const fileContent = JSON.parse(fs.readFileSync(result.filename, 'utf8'));
      expect(fileContent.spdxVersion).toBe('SPDX-2.3');
    });

    test('should throw error for unsupported format', async () => {
      await expect(sbom.exportToFile('invalid', testProjectPath)).rejects.toThrow("Unsupported format: invalid. Use 'cyclonedx' or 'spdx'");
    });
  });

  describe('SBOM Validation', () => {
    test('should validate empty SBOM', () => {
      const validation = sbom.validateSBOM();
      
      expect(validation.valid).toBe(true);
      expect(validation.stats.totalComponents).toBe(0);
    });

    test('should validate SBOM with components', () => {
      sbom.addComponent({
        name: 'component-with-license',
        version: '1.0.0',
        type: 'library',
        license: 'MIT',
        description: 'Well documented component'
      });

      sbom.addComponent({
        name: 'component-without-license',
        version: '2.0.0',
        type: 'library',
        license: 'UNKNOWN'
      });

      const validation = sbom.validateSBOM();
      
      expect(validation.valid).toBe(true);
      expect(validation.stats.totalComponents).toBe(2);
      expect(validation.stats.licensedComponents).toBe(1);
      expect(validation.stats.unlicensedComponents).toBe(1);
      expect(validation.stats.componentsWithDescription).toBe(1);
      expect(validation.warnings).toContain('Component component-without-license has unknown license');
      expect(validation.warnings).toContain('Component component-without-license missing description');
    });

    test('should report errors for components with unknown versions', () => {
      sbom.addComponent({
        name: 'bad-component',
        version: 'unknown',
        type: 'library',
        license: 'MIT'
      });

      const validation = sbom.validateSBOM();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Component bad-component has unknown version');
    });
  });

  describe('Real World Integration', () => {
    test('should handle typical Node.js project structure', async () => {
      const packageJson = {
        name: 'real-world-app',
        version: '2.1.0',
        description: 'A real world application',
        license: 'Apache-2.0',
        repository: {
          type: 'git',
          url: 'https://github.com/example/real-world-app'
        },
        dependencies: {
          express: '4.18.0',
          lodash: '4.17.21',
          moment: '2.29.4'
        },
        devDependencies: {
          jest: '29.0.0',
          eslint: '8.0.0'
        }
      };

      fs.writeFileSync(path.join(testProjectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

      await sbom.analyzeProject(testProjectPath);
      
      const cycloneDX = sbom.generateCycloneDX();
      const spdxDoc = sbom.generateSPDX();
      const validation = sbom.validateSBOM();

      expect(sbom.components.size).toBe(6); // Main app + 5 dependencies
      expect(cycloneDX.metadata.component.name).toBe('real-world-app');
      expect(spdxDoc.packages).toHaveLength(6);
      expect(validation.valid).toBe(true);
      expect(Array.from(sbom.licenses)).toContain('Apache-2.0');
    });
  });
});
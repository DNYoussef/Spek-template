import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';

export interface ProtocolVersion {
  version: string;
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
  releaseDate: Date;
  endOfLife?: Date;
  features: ProtocolFeature[];
  breakingChanges: BreakingChange[];
  dependencies: VersionDependency[];
  compatibility: CompatibilityInfo;
  deprecations: Deprecation[];
  security: SecurityInfo;
}

export interface ProtocolFeature {
  id: string;
  name: string;
  description: string;
  type: 'enhancement' | 'new' | 'deprecated' | 'removed';
  introducedIn: string;
  removedIn?: string;
  migrationPath?: string;
}

export interface BreakingChange {
  id: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  migrationRequired: boolean;
  automatedMigration: boolean;
  migrationSteps: string[];
}

export interface VersionDependency {
  name: string;
  version: string;
  type: 'required' | 'optional' | 'recommended';
  compatibility: string[];
}

export interface CompatibilityInfo {
  backwardCompatible: string[];
  forwardCompatible: string[];
  partiallyCompatible: PartialCompatibility[];
  incompatible: string[];
}

export interface PartialCompatibility {
  version: string;
  limitations: string[];
  workarounds: string[];
}

export interface Deprecation {
  feature: string;
  deprecatedIn: string;
  removedIn: string;
  reason: string;
  replacement: string;
  migrationGuide: string;
}

export interface SecurityInfo {
  vulnerabilities: SecurityVulnerability[];
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  encryption: EncryptionInfo;
  authentication: AuthenticationInfo;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fixedIn: string;
  cve?: string;
}

export interface EncryptionInfo {
  algorithms: string[];
  keySize: number;
  tlsVersion: string;
}

export interface AuthenticationInfo {
  methods: string[];
  tokenFormat: string;
  sessionManagement: string;
}

export interface VersionDelta {
  major: number;
  minor: number;
  patch: number;
  breakingChanges: BreakingChange[];
  newFeatures: ProtocolFeature[];
  deprecatedFeatures: ProtocolFeature[];
  removedFeatures: ProtocolFeature[];
  securityChanges: SecurityVulnerability[];
  migrationComplexity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MigrationPath {
  from: string;
  to: string;
  intermediateVersions: string[];
  directMigration: boolean;
  estimatedDuration: number;
  complexity: 'low' | 'medium' | 'high' | 'critical';
  requiredSteps: MigrationStep[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MigrationStep {
  order: number;
  action: string;
  description: string;
  automated: boolean;
  estimatedTime: number;
  rollbackAction?: string;
}

export class ProtocolVersionManager extends EventEmitter {
  private logger: Logger;
  private versions: Map<string, ProtocolVersion>;
  private currentVersion: string;
  private migrationPaths: Map<string, MigrationPath>;
  private compatibilityMatrix: Map<string, Map<string, boolean>>;

  constructor() {
    super();
    this.logger = new Logger('ProtocolVersionManager');
    this.versions = new Map();
    this.migrationPaths = new Map();
    this.compatibilityMatrix = new Map();
    this.initializeVersions();
  }

  async registerVersion(version: ProtocolVersion): Promise<void> {
    this.logger.info('Registering protocol version', { version: version.version });

    // Validate version format
    if (!this.isValidVersionFormat(version.version)) {
      throw new Error(`Invalid version format: ${version.version}`);
    }

    // Check for conflicts
    if (this.versions.has(version.version)) {
      throw new Error(`Version already registered: ${version.version}`);
    }

    // Parse semantic version
    const semver = this.parseSemanticVersion(version.version);
    version.major = semver.major;
    version.minor = semver.minor;
    version.patch = semver.patch;
    version.prerelease = semver.prerelease;
    version.build = semver.build;

    this.versions.set(version.version, version);
    await this.updateCompatibilityMatrix(version);
    await this.generateMigrationPaths(version);

    this.emit('versionRegistered', version);
  }

  async setCurrentVersion(version: string): Promise<void> {
    if (!this.versions.has(version)) {
      throw new Error(`Version not registered: ${version}`);
    }

    const oldVersion = this.currentVersion;
    this.currentVersion = version;

    this.logger.info('Current version updated', {
      from: oldVersion,
      to: version
    });

    this.emit('currentVersionChanged', { from: oldVersion, to: version });
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  getVersion(version: string): ProtocolVersion | undefined {
    return this.versions.get(version);
  }

  getAllVersions(): ProtocolVersion[] {
    return Array.from(this.versions.values()).sort((a, b) => {
      return this.compareVersions(a.version, b.version);
    });
  }

  getLatestVersion(): ProtocolVersion | undefined {
    const versions = this.getAllVersions();
    return versions[versions.length - 1];
  }

  async calculateVersionDelta(
    fromVersion: string,
    toVersion: string
  ): Promise<VersionDelta> {
    const from = this.versions.get(fromVersion);
    const to = this.versions.get(toVersion);

    if (!from || !to) {
      throw new Error(`Version not found: ${!from ? fromVersion : toVersion}`);
    }

    const majorDelta = to.major - from.major;
    const minorDelta = to.minor - from.minor;
    const patchDelta = to.patch - from.patch;

    // Collect changes between versions
    const breakingChanges = this.getBreakingChangesBetween(from, to);
    const newFeatures = this.getNewFeaturesBetween(from, to);
    const deprecatedFeatures = this.getDeprecatedFeaturesBetween(from, to);
    const removedFeatures = this.getRemovedFeaturesBetween(from, to);
    const securityChanges = this.getSecurityChangesBetween(from, to);

    // Calculate migration complexity
    const migrationComplexity = this.calculateMigrationComplexity(
      majorDelta,
      breakingChanges,
      removedFeatures
    );

    return {
      major: majorDelta,
      minor: minorDelta,
      patch: patchDelta,
      breakingChanges,
      newFeatures,
      deprecatedFeatures,
      removedFeatures,
      securityChanges,
      migrationComplexity
    };
  }

  async getMigrationPath(
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationPath> {
    const pathKey = `${fromVersion}_to_${toVersion}`;
    let path = this.migrationPaths.get(pathKey);

    if (!path) {
      path = await this.calculateMigrationPath(fromVersion, toVersion);
      this.migrationPaths.set(pathKey, path);
    }

    return path;
  }

  async isCompatible(
    version1: string,
    version2: string
  ): Promise<boolean> {
    const v1Matrix = this.compatibilityMatrix.get(version1);
    if (!v1Matrix) {
      return false;
    }

    return v1Matrix.get(version2) || false;
  }

  async getCompatibleVersions(version: string): Promise<string[]> {
    const versionInfo = this.versions.get(version);
    if (!versionInfo) {
      return [];
    }

    return [
      ...versionInfo.compatibility.backwardCompatible,
      ...versionInfo.compatibility.forwardCompatible,
      ...versionInfo.compatibility.partiallyCompatible.map(pc => pc.version)
    ];
  }

  async validateMigrationPath(
    fromVersion: string,
    toVersion: string
  ): Promise<{ valid: boolean; reason?: string; warnings?: string[] }> {
    const from = this.versions.get(fromVersion);
    const to = this.versions.get(toVersion);

    if (!from) {
      return { valid: false, reason: `Source version not found: ${fromVersion}` };
    }

    if (!to) {
      return { valid: false, reason: `Target version not found: ${toVersion}` };
    }

    // Check if target version is end-of-life
    if (to.endOfLife && to.endOfLife < new Date()) {
      return {
        valid: false,
        reason: `Target version is end-of-life: ${toVersion}`
      };
    }

    // Check for major version jumps
    const delta = await this.calculateVersionDelta(fromVersion, toVersion);
    const warnings: string[] = [];

    if (delta.major > 1) {
      warnings.push('Major version jump detected - consider intermediate migration');
    }

    if (delta.breakingChanges.length > 10) {
      warnings.push('High number of breaking changes - thorough testing required');
    }

    if (delta.migrationComplexity === 'critical') {
      return {
        valid: false,
        reason: 'Migration complexity too high - manual intervention required',
        warnings
      };
    }

    return { valid: true, warnings };
  }

  async getVersionsByFeature(featureId: string): Promise<string[]> {
    const versionsWithFeature: string[] = [];

    for (const [version, versionInfo] of this.versions) {
      const hasFeature = versionInfo.features.some(
        feature => feature.id === featureId && feature.type !== 'removed'
      );

      if (hasFeature) {
        versionsWithFeature.push(version);
      }
    }

    return versionsWithFeature.sort((a, b) => this.compareVersions(a, b));
  }

  async getDeprecatedFeatures(version: string): Promise<Deprecation[]> {
    const versionInfo = this.versions.get(version);
    return versionInfo?.deprecations || [];
  }

  async getSecurityLevel(version: string): Promise<string> {
    const versionInfo = this.versions.get(version);
    return versionInfo?.security.securityLevel || 'unknown';
  }

  private initializeVersions(): void {
    // Initialize with base protocol versions
    const baseVersions = [
      {
        version: '1.0.0',
        releaseDate: new Date('2023-01-01'),
        features: [
          {
            id: 'basic_messaging',
            name: 'Basic Messaging',
            description: 'Core message routing and delivery',
            type: 'new' as const,
            introducedIn: '1.0.0'
          }
        ],
        breakingChanges: [],
        dependencies: [],
        compatibility: {
          backwardCompatible: [],
          forwardCompatible: ['1.0.1', '1.1.0'],
          partiallyCompatible: [],
          incompatible: ['2.0.0']
        },
        deprecations: [],
        security: {
          vulnerabilities: [],
          securityLevel: 'medium' as const,
          encryption: {
            algorithms: ['AES-256'],
            keySize: 256,
            tlsVersion: '1.2'
          },
          authentication: {
            methods: ['token'],
            tokenFormat: 'JWT',
            sessionManagement: 'stateless'
          }
        }
      }
    ];

    baseVersions.forEach(async version => {
      await this.registerVersion(version as ProtocolVersion);
    });

    this.currentVersion = '1.0.0';
  }

  private isValidVersionFormat(version: string): boolean {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    return semverRegex.test(version);
  }

  private parseSemanticVersion(version: string): {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
  } {
    const parts = version.split('+');
    const build = parts[1];
    const mainParts = parts[0].split('-');
    const prerelease = mainParts[1];
    const versionParts = mainParts[0].split('.');

    return {
      major: parseInt(versionParts[0], 10),
      minor: parseInt(versionParts[1], 10),
      patch: parseInt(versionParts[2], 10),
      prerelease,
      build
    };
  }

  private compareVersions(a: string, b: string): number {
    const vA = this.parseSemanticVersion(a);
    const vB = this.parseSemanticVersion(b);

    if (vA.major !== vB.major) return vA.major - vB.major;
    if (vA.minor !== vB.minor) return vA.minor - vB.minor;
    if (vA.patch !== vB.patch) return vA.patch - vB.patch;

    // Handle prerelease versions
    if (vA.prerelease && !vB.prerelease) return -1;
    if (!vA.prerelease && vB.prerelease) return 1;
    if (vA.prerelease && vB.prerelease) {
      return vA.prerelease.localeCompare(vB.prerelease);
    }

    return 0;
  }

  private async updateCompatibilityMatrix(version: ProtocolVersion): Promise<void> {
    if (!this.compatibilityMatrix.has(version.version)) {
      this.compatibilityMatrix.set(version.version, new Map());
    }

    const matrix = this.compatibilityMatrix.get(version.version)!;

    // Update compatibility with all registered versions
    for (const [otherVersion, otherVersionInfo] of this.versions) {
      if (otherVersion === version.version) continue;

      const isCompatible = this.checkCompatibility(version, otherVersionInfo);
      matrix.set(otherVersion, isCompatible);

      // Update reverse compatibility
      if (!this.compatibilityMatrix.has(otherVersion)) {
        this.compatibilityMatrix.set(otherVersion, new Map());
      }
      this.compatibilityMatrix.get(otherVersion)!.set(version.version, isCompatible);
    }
  }

  private checkCompatibility(v1: ProtocolVersion, v2: ProtocolVersion): boolean {
    // Same version is always compatible
    if (v1.version === v2.version) return true;

    // Check explicit compatibility lists
    if (v1.compatibility.backwardCompatible.includes(v2.version) ||
        v1.compatibility.forwardCompatible.includes(v2.version)) {
      return true;
    }

    // Check partial compatibility
    if (v1.compatibility.partiallyCompatible.some(pc => pc.version === v2.version)) {
      return true;
    }

    // Check explicit incompatibility
    if (v1.compatibility.incompatible.includes(v2.version)) {
      return false;
    }

    // Default compatibility rules based on semantic versioning
    const delta1 = Math.abs(v1.major - v2.major);
    const delta2 = Math.abs(v1.minor - v2.minor);

    // Major version differences are incompatible
    if (delta1 > 0) return false;

    // Minor version differences within same major are compatible
    if (delta1 === 0 && delta2 <= 2) return true;

    return false;
  }

  private async generateMigrationPaths(version: ProtocolVersion): Promise<void> {
    for (const [otherVersion] of this.versions) {
      if (otherVersion === version.version) continue;

      // Generate path from other version to this version
      const pathKey = `${otherVersion}_to_${version.version}`;
      if (!this.migrationPaths.has(pathKey)) {
        const path = await this.calculateMigrationPath(otherVersion, version.version);
        this.migrationPaths.set(pathKey, path);
      }

      // Generate path from this version to other version
      const reversePath = `${version.version}_to_${otherVersion}`;
      if (!this.migrationPaths.has(reversePath)) {
        const path = await this.calculateMigrationPath(version.version, otherVersion);
        this.migrationPaths.set(reversePath, path);
      }
    }
  }

  private async calculateMigrationPath(
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationPath> {
    const from = this.versions.get(fromVersion)!;
    const to = this.versions.get(toVersion)!;

    // Simple direct migration for now
    // TODO: Implement complex path finding for multi-hop migrations
    const delta = await this.calculateVersionDelta(fromVersion, toVersion);

    const steps: MigrationStep[] = [];
    let stepOrder = 1;

    // Add backup step
    steps.push({
      order: stepOrder++,
      action: 'backup',
      description: 'Create system backup',
      automated: true,
      estimatedTime: 300000, // 5 minutes
      rollbackAction: 'restore_backup'
    });

    // Add breaking change steps
    for (const change of delta.breakingChanges) {
      if (change.migrationRequired) {
        steps.push({
          order: stepOrder++,
          action: 'apply_breaking_change',
          description: `Handle breaking change: ${change.description}`,
          automated: change.automatedMigration,
          estimatedTime: change.automatedMigration ? 60000 : 300000,
          rollbackAction: 'revert_breaking_change'
        });
      }
    }

    // Add feature migration steps
    for (const feature of delta.newFeatures) {
      if (feature.migrationPath) {
        steps.push({
          order: stepOrder++,
          action: 'migrate_feature',
          description: `Migrate feature: ${feature.name}`,
          automated: true,
          estimatedTime: 120000, // 2 minutes
          rollbackAction: 'remove_feature'
        });
      }
    }

    // Add validation step
    steps.push({
      order: stepOrder++,
      action: 'validate',
      description: 'Validate migration success',
      automated: true,
      estimatedTime: 180000, // 3 minutes
    });

    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);

    return {
      from: fromVersion,
      to: toVersion,
      intermediateVersions: [], // Direct migration
      directMigration: true,
      estimatedDuration: totalTime,
      complexity: delta.migrationComplexity,
      requiredSteps: steps,
      riskLevel: this.calculateRiskLevel(delta, steps)
    };
  }

  private getBreakingChangesBetween(
    from: ProtocolVersion,
    to: ProtocolVersion
  ): BreakingChange[] {
    if (to.major > from.major) {
      return to.breakingChanges;
    }
    return [];
  }

  private getNewFeaturesBetween(
    from: ProtocolVersion,
    to: ProtocolVersion
  ): ProtocolFeature[] {
    return to.features.filter(feature => {
      const introducedVersion = this.parseSemanticVersion(feature.introducedIn);
      const fromParsed = this.parseSemanticVersion(from.version);

      return (
        introducedVersion.major > fromParsed.major ||
        (introducedVersion.major === fromParsed.major && introducedVersion.minor > fromParsed.minor) ||
        (introducedVersion.major === fromParsed.major &&
         introducedVersion.minor === fromParsed.minor &&
         introducedVersion.patch > fromParsed.patch)
      );
    });
  }

  private getDeprecatedFeaturesBetween(
    from: ProtocolVersion,
    to: ProtocolVersion
  ): ProtocolFeature[] {
    return to.features.filter(feature => feature.type === 'deprecated');
  }

  private getRemovedFeaturesBetween(
    from: ProtocolVersion,
    to: ProtocolVersion
  ): ProtocolFeature[] {
    return from.features.filter(feature => {
      return !to.features.some(toFeature => toFeature.id === feature.id);
    });
  }

  private getSecurityChangesBetween(
    from: ProtocolVersion,
    to: ProtocolVersion
  ): SecurityVulnerability[] {
    const fromVulns = new Set(from.security.vulnerabilities.map(v => v.id));
    return to.security.vulnerabilities.filter(vuln => !fromVulns.has(vuln.id));
  }

  private calculateMigrationComplexity(
    majorDelta: number,
    breakingChanges: BreakingChange[],
    removedFeatures: ProtocolFeature[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (majorDelta > 1) return 'critical';
    if (majorDelta === 1 && breakingChanges.length > 5) return 'critical';
    if (breakingChanges.length > 10) return 'high';
    if (breakingChanges.length > 3 || removedFeatures.length > 0) return 'medium';
    return 'low';
  }

  private calculateRiskLevel(
    delta: VersionDelta,
    steps: MigrationStep[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (delta.migrationComplexity === 'critical') return 'critical';
    if (delta.major > 0) return 'high';
    if (steps.some(step => !step.automated)) return 'medium';
    return 'low';
  }
}

export default ProtocolVersionManager;
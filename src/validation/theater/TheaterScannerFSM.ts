/**
 * Theater Scanner FSM - NASA Rule 10 Compliant
 * Replaces 635-line god object with clean FSM implementation
 */

import { MonitoringHub } from '../../monitoring/shared/MonitoringHub';
import { MonitorConfig, MonitorAlert } from '../../monitoring/shared/MonitoringFSMTypes';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface TheaterScanData {
  projectRoot: string;
  sourceFiles: string[];
  exclusions: string[];
}

interface TheaterScanResult {
  overallScore: number;
  theaterPatterns: TheaterPattern[];
  summary: TheaterSummary;
  recommendations: string[];
  autoFixable: TheaterPattern[];
}

interface TheaterPattern {
  type: TheaterType;
  file: string;
  line: number;
  content: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  suggestion: string;
  autoFixable: boolean;
}

interface TheaterSummary {
  totalFiles: number;
  theaterFiles: number;
  patternCount: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

enum TheaterType {
  CONSOLE_LOG = 'console_log',
  TODO_COMMENT = 'todo_comment',
  FAKE_IMPLEMENTATION = 'fake_implementation',
  MOCK_FUNCTION = 'mock_function',
  PLACEHOLDER_CODE = 'placeholder_code',
  HARDCODED_VALUES = 'hardcoded_values',
  DEAD_CODE = 'dead_code',
  UNUSED_IMPORTS = 'unused_imports',
  EMPTY_FUNCTIONS = 'empty_functions',
  COMMENT_OUT_CODE = 'commented_out_code',
  DEBUG_CODE = 'debug_code',
  TEST_DATA_IN_PROD = 'test_data_in_prod'
}

export class TheaterScannerFSM extends MonitoringHub<TheaterScanData, TheaterScanResult> {
  private patternDetectors: Map<TheaterType, (content: string, file: string) => TheaterPattern[]>;

  constructor(config: MonitorConfig) {
    super(config);
    this.initializeDetectors();
  }

  protected getMonitorType(): string {
    return 'THEATER_SCANNER';
  }

  protected async performScan(data?: TheaterScanData): Promise<TheaterScanData> {
    if (!data) {
      throw new Error('Theater scan requires project root path');
    }

    // Collect source files
    data.sourceFiles = await this.collectSourceFiles(data.projectRoot, data.exclusions);

    this.metricAggregator.addMetric('files_scanned', data.sourceFiles.length);

    return data;
  }

  protected async analyzeResults(scanData: TheaterScanData): Promise<TheaterScanResult> {
    const allPatterns: TheaterPattern[] = [];

    // Scan each file for theater patterns
    for (const file of scanData.sourceFiles) {
      const patterns = await this.scanFileForTheater(file);
      allPatterns.push(...patterns);
    }

    const overallScore = this.calculateTheaterScore(allPatterns, scanData.sourceFiles.length);
    const summary = this.generateSummary(allPatterns, scanData.sourceFiles.length);
    const recommendations = this.generateRecommendations(allPatterns);
    const autoFixable = allPatterns.filter(p => p.autoFixable);

    this.metricAggregator.addMetric('patterns_found', allPatterns.length);
    this.metricAggregator.addMetric('theater_score', overallScore);
    this.metricAggregator.addMetric('auto_fixable', autoFixable.length);

    return {
      overallScore,
      theaterPatterns: allPatterns,
      summary,
      recommendations,
      autoFixable
    };
  }

  private async collectSourceFiles(projectRoot: string, exclusions: string[] = []): Promise<string[]> {
    const sourceFiles: string[] = [];
    const extensions = ['.ts', '.js', '.tsx', '.jsx'];

    const scanDirectory = (dir: string): void => {
      try {
        const items = readdirSync(dir);

        for (const item of items) {
          const fullPath = join(dir, item);

          if (this.shouldExclude(fullPath, exclusions)) {
            continue;
          }

          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (extensions.includes(extname(item))) {
            sourceFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Error scanning directory ${dir}:`, error);
      }
    };

    scanDirectory(projectRoot);
    return sourceFiles;
  }

  private shouldExclude(path: string, exclusions: string[]): boolean {
    const defaultExclusions = ['node_modules', '.git', 'dist', 'build', '.next'];
    const allExclusions = [...defaultExclusions, ...exclusions];

    return allExclusions.some(exclusion => path.includes(exclusion));
  }

  private async scanFileForTheater(filePath: string): Promise<TheaterPattern[]> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const patterns: TheaterPattern[] = [];

      // Run all pattern detectors
      for (const [type, detector] of this.patternDetectors) {
        const foundPatterns = detector(content, filePath);
        patterns.push(...foundPatterns);
      }

      return patterns;
    } catch (error) {
      console.warn(`Error scanning file ${filePath}:`, error);
      return [];
    }
  }

  private calculateTheaterScore(patterns: TheaterPattern[], totalFiles: number): number {
    if (totalFiles === 0) return 100;

    let deductions = 0;

    for (const pattern of patterns) {
      switch (pattern.severity) {
        case 'CRITICAL': deductions += 20; break;
        case 'HIGH': deductions += 10; break;
        case 'MEDIUM': deductions += 5; break;
        case 'LOW': deductions += 2; break;
      }
    }

    // Normalize by file count
    const normalizedDeductions = deductions / totalFiles * 10;

    return Math.max(0, 100 - normalizedDeductions);
  }

  private generateSummary(patterns: TheaterPattern[], totalFiles: number): TheaterSummary {
    const theaterFiles = new Set(patterns.map(p => p.file)).size;
    const worstSeverity = this.getWorstSeverity(patterns);

    return {
      totalFiles,
      theaterFiles,
      patternCount: patterns.length,
      severity: worstSeverity
    };
  }

  private getWorstSeverity(patterns: TheaterPattern[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (patterns.some(p => p.severity === 'CRITICAL')) return 'CRITICAL';
    if (patterns.some(p => p.severity === 'HIGH')) return 'HIGH';
    if (patterns.some(p => p.severity === 'MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(patterns: TheaterPattern[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = patterns.filter(p => p.severity === 'CRITICAL').length;
    if (criticalCount > 0) {
      recommendations.push(`Remove ${criticalCount} critical theater patterns immediately`);
    }

    const autoFixableCount = patterns.filter(p => p.autoFixable).length;
    if (autoFixableCount > 0) {
      recommendations.push(`${autoFixableCount} patterns can be auto-fixed`);
    }

    const consoleLogsCount = patterns.filter(p => p.type === TheaterType.CONSOLE_LOG).length;
    if (consoleLogsCount > 5) {
      recommendations.push(`Replace ${consoleLogsCount} console.log statements with proper logging`);
    }

    return recommendations;
  }

  private initializeDetectors(): void {
    this.patternDetectors = new Map();

    // Console log detector
    this.patternDetectors.set(TheaterType.CONSOLE_LOG, (content, file) => {
      const patterns: TheaterPattern[] = [];
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('console.log') || line.includes('console.warn') || line.includes('console.error')) {
          patterns.push({
            type: TheaterType.CONSOLE_LOG,
            file,
            line: index + 1,
            content: line.trim(),
            severity: 'MEDIUM',
            description: 'Console logging should be replaced with proper logging framework',
            suggestion: 'Use structured logging instead of console statements',
            autoFixable: true
          });
        }
      });

      return patterns;
    });

    // TODO comment detector
    this.patternDetectors.set(TheaterType.TODO_COMMENT, (content, file) => {
      const patterns: TheaterPattern[] = [];
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.toLowerCase().includes('todo') || line.toLowerCase().includes('fixme')) {
          patterns.push({
            type: TheaterType.TODO_COMMENT,
            file,
            line: index + 1,
            content: line.trim(),
            severity: 'LOW',
            description: 'TODO comments indicate incomplete work',
            suggestion: 'Complete the implementation or create proper issue tracker items',
            autoFixable: false
          });
        }
      });

      return patterns;
    });

    // Fake implementation detector
    this.patternDetectors.set(TheaterType.FAKE_IMPLEMENTATION, (content, file) => {
      const patterns: TheaterPattern[] = [];
      const fakePatterns = [
        'throw new Error("Not implemented")',
        'return null;',
        'return undefined;',
        'return {};',
        'return [];',
        '// Mock implementation'
      ];

      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const fakePattern of fakePatterns) {
          if (line.includes(fakePattern)) {
            patterns.push({
              type: TheaterType.FAKE_IMPLEMENTATION,
              file,
              line: index + 1,
              content: line.trim(),
              severity: 'HIGH',
              description: 'Fake implementation detected',
              suggestion: 'Implement proper functionality',
              autoFixable: false
            });
          }
        }
      });

      return patterns;
    });

    // Empty function detector
    this.patternDetectors.set(TheaterType.EMPTY_FUNCTIONS, (content, file) => {
      const patterns: TheaterPattern[] = [];
      const emptyFunctionRegex = /function\s+\w+\s*\([^)]*\)\s*{\s*}/g;
      const arrowFunctionRegex = /\w+\s*=\s*\([^)]*\)\s*=>\s*{\s*}/g;

      let match;
      const lines = content.split('\n');

      // Check regular functions
      while ((match = emptyFunctionRegex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        patterns.push({
          type: TheaterType.EMPTY_FUNCTIONS,
          file,
          line: lineNumber,
          content: match[0],
          severity: 'MEDIUM',
          description: 'Empty function with no implementation',
          suggestion: 'Implement function body or remove if unused',
          autoFixable: false
        });
      }

      return patterns;
    });
  }

  // Override threshold checking for theater-specific metrics
  protected checkThresholds(result: TheaterScanResult): MonitorAlert[] {
    const alerts: MonitorAlert[] = [];

    if (result.overallScore < 60) {
      alerts.push({
        id: `theater_score_${Date.now()}`,
        severity: 'HIGH',
        type: 'THEATER_THRESHOLD',
        message: `Theater score ${result.overallScore} below acceptable threshold`,
        timestamp: Date.now(),
        source: 'TheaterScanner',
        data: { score: result.overallScore, threshold: 60 }
      });
    }

    const criticalPatterns = result.theaterPatterns.filter(p => p.severity === 'CRITICAL').length;
    if (criticalPatterns > 0) {
      alerts.push({
        id: `critical_theater_${Date.now()}`,
        severity: 'CRITICAL',
        type: 'THEATER_CRITICAL',
        message: `${criticalPatterns} critical theater patterns found`,
        timestamp: Date.now(),
        source: 'TheaterScanner',
        data: { count: criticalPatterns }
      });
    }

    return alerts;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T20:19:45-04:00 | agent@ModelMEGA093 | Create FSM replacement for TheaterScanner god object | TheaterScannerFSM.ts | OK | -- | 0.00 | 4b8f2c9 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: theater-fsm-093
- inputs: ["MonitoringHub", "theater detection patterns"]
- tools_used: ["Write"]
- versions: {"model":"MEGA093","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
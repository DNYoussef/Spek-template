/**
 * Theater Detection Scanner
 * Comprehensive detection and elimination of performance theater patterns
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface TheaterScanResult {
  overallScore: number; // 0-100, where 100 = no theater
  theaterPatterns: TheaterPattern[];
  summary: {
    totalFiles: number;
    theaterFiles: number;
    patternCount: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  recommendations: string[];
  autoFixable: TheaterPattern[];
}

export interface TheaterPattern {
  type: TheaterType;
  file: string;
  line: number;
  content: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  suggestion: string;
  autoFixable: boolean;
}

export enum TheaterType {
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

export class TheaterScanner {
  private projectRoot: string;
  private sourceFiles: string[] = [];
  private excludePatterns: RegExp[] = [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /coverage/,
    /\.test\./,
    /\.spec\./
  ];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.sourceFiles = this.findSourceFiles();
  }

  async scanForTheater(): Promise<TheaterScanResult> {
    const theaterPatterns = await this.detectAllPatterns();
    const overallScore = this.calculateTheaterScore(theaterPatterns);
    const summary = this.generateSummary(theaterPatterns);
    const recommendations = this.generateRecommendations(theaterPatterns);
    const autoFixable = theaterPatterns.filter(p => p.autoFixable);

    return {
      overallScore,
      theaterPatterns,
      summary,
      recommendations,
      autoFixable
    };
  }

  private async detectAllPatterns(): Promise<TheaterPattern[]> {
    const patterns: TheaterPattern[] = [];

    for (const file of this.sourceFiles) {
      const content = readFileSync(file, 'utf8');
      const lines = content.split('\\n');

      patterns.push(...this.detectConsoleStatements(file, lines));
      patterns.push(...this.detectTodoComments(file, lines));
      patterns.push(...this.detectFakeImplementations(file, lines));
      patterns.push(...this.detectMockFunctions(file, lines));
      patterns.push(...this.detectPlaceholderCode(file, lines));
      patterns.push(...this.detectHardcodedValues(file, lines));
      patterns.push(...this.detectDeadCode(file, lines));
      patterns.push(...this.detectUnusedImports(file, content));
      patterns.push(...this.detectEmptyFunctions(file, content));
      patterns.push(...this.detectCommentedOutCode(file, lines));
      patterns.push(...this.detectDebugCode(file, lines));
      patterns.push(...this.detectTestDataInProduction(file, lines));
    }

    return patterns;
  }

  private detectConsoleStatements(file: string, lines: string[]): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    const consolePattern = /console\\.(log|warn|error|debug|info|trace)\\s*\\(/;\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n      if (consolePattern.test(line)) {\n        patterns.push({\n          type: TheaterType.CONSOLE_LOG,\n          file,\n          line: i + 1,\n          content: line.trim(),\n          severity: 'HIGH',\n          description: 'Console statement found in production code',\n          suggestion: 'Replace with proper logging framework or remove',\n          autoFixable: true\n        });\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectTodoComments(file: string, lines: string[]): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    const todoPattern = /\\b(TODO|FIXME|XXX|HACK|BUG)\\b/i;\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n      if (todoPattern.test(line)) {\n        const match = line.match(todoPattern);\n        const keyword = match ? match[1] : 'TODO';\n        \n        patterns.push({\n          type: TheaterType.TODO_COMMENT,\n          file,\n          line: i + 1,\n          content: line.trim(),\n          severity: keyword === 'HACK' || keyword === 'BUG' ? 'CRITICAL' : 'MEDIUM',\n          description: `${keyword} comment indicates incomplete work`,\n          suggestion: 'Complete the implementation or create proper issue tracking',\n          autoFixable: false\n        });\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectFakeImplementations(file: string, lines: string[]): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    const fakePatterns = [\n      /fake[A-Z]\\w*/,\n      /stub[A-Z]\\w*/,\n      /dummy[A-Z]\\w*/,\n      /return\\s+null\\s*;\\s*\\/\\/ TODO/,\n      /throw\\s+new\\s+Error\\s*\\(\\s*['\"]not\\s+implemented['\"]/i,\n      /return\\s+['\"]fake['\"]/i\n    ];\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n      \n      for (const pattern of fakePatterns) {\n        if (pattern.test(line)) {\n          patterns.push({\n            type: TheaterType.FAKE_IMPLEMENTATION,\n            file,\n            line: i + 1,\n            content: line.trim(),\n            severity: 'CRITICAL',\n            description: 'Fake or stub implementation detected',\n            suggestion: 'Implement real functionality',\n            autoFixable: false\n          });\n        }\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectMockFunctions(file: string, lines: string[]): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    const mockPatterns = [\n      /mock[A-Z]\\w*/,\n      /jest\\.mock/,\n      /sinon\\./,\n      /vi\\.mock/,\n      /\\bmock\\b.*function/i\n    ];\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n      \n      for (const pattern of mockPatterns) {\n        if (pattern.test(line) && !file.includes('.test.') && !file.includes('.spec.')) {\n          patterns.push({\n            type: TheaterType.MOCK_FUNCTION,\n            file,\n            line: i + 1,\n            content: line.trim(),\n            severity: 'HIGH',\n            description: 'Mock function in production code',\n            suggestion: 'Replace with real implementation or move to test file',\n            autoFixable: false\n          });\n        }\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectPlaceholderCode(file: string, lines: string[]): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    const placeholderPatterns = [\n      /placeholder/i,\n      /lorem\\s+ipsum/i,\n      /sample\\s+data/i,\n      /test\\s+value/i,\n      /example\\.com/,\n      /user@example/,\n      /password.*123/i,\n      /api[_-]?key.*test/i\n    ];\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n      \n      for (const pattern of placeholderPatterns) {\n        if (pattern.test(line)) {\n          patterns.push({\n            type: TheaterType.PLACEHOLDER_CODE,\n            file,\n            line: i + 1,\n            content: line.trim(),\n            severity: 'MEDIUM',\n            description: 'Placeholder or example data detected',\n            suggestion: 'Replace with real production values or configuration',\n            autoFixable: false\n          });\n        }\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectHardcodedValues(file: string, lines: string[]): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    const hardcodedPatterns = [\n      /localhost:\\d+/,\n      /127\\.0\\.0\\.1/,\n      /192\\.168\\./,\n      /password\\s*[:=]\\s*['\"]\\w+['\"]/i,\n      /api[_-]?key\\s*[:=]\\s*['\"]\\w+['\"]/i,\n      /secret\\s*[:=]\\s*['\"]\\w+['\"]/i\n    ];\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n      \n      for (const pattern of hardcodedPatterns) {\n        if (pattern.test(line)) {\n          patterns.push({\n            type: TheaterType.HARDCODED_VALUES,\n            file,\n            line: i + 1,\n            content: line.trim(),\n            severity: 'HIGH',\n            description: 'Hardcoded value detected',\n            suggestion: 'Move to environment variables or configuration file',\n            autoFixable: false\n          });\n        }\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectDeadCode(file: string, lines: string[]): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    let inDeadBlock = false;\n    let deadBlockStart = 0;\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i].trim();\n      \n      // Check for unreachable code after return\n      if (line === 'return;' || line.startsWith('return ')) {\n        // Look for code after return in the same block\n        for (let j = i + 1; j < lines.length && j < i + 10; j++) {\n          const nextLine = lines[j].trim();\n          if (nextLine && !nextLine.startsWith('}') && !nextLine.startsWith('//')  && !nextLine.startsWith('*')) {\n            patterns.push({\n              type: TheaterType.DEAD_CODE,\n              file,\n              line: j + 1,\n              content: nextLine,\n              severity: 'MEDIUM',\n              description: 'Unreachable code after return statement',\n              suggestion: 'Remove unreachable code',\n              autoFixable: true\n            });\n            break;\n          }\n          if (nextLine.startsWith('}')) break;\n        }\n      }\n\n      // Check for if (false) blocks\n      if (line.includes('if (false)') || line.includes('if(false)')) {\n        patterns.push({\n          type: TheaterType.DEAD_CODE,\n          file,\n          line: i + 1,\n          content: line,\n          severity: 'HIGH',\n          description: 'Dead code block with if(false)',\n          suggestion: 'Remove dead code block',\n          autoFixable: true\n        });\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectUnusedImports(file: string, content: string): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    const lines = content.split('\\n');\n    const importPattern = /import\\s+(?:{([^}]+)}|([^\\s]+))\\s+from\\s+['\"]([^'\"]+)['\"]/;\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n      const match = line.match(importPattern);\n      \n      if (match) {\n        const imports = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]];\n        const module = match[3];\n        \n        for (const importName of imports) {\n          if (importName && !content.includes(importName.replace(/\\s*as\\s+\\w+/, ''))) {\n            patterns.push({\n              type: TheaterType.UNUSED_IMPORTS,\n              file,\n              line: i + 1,\n              content: line.trim(),\n              severity: 'LOW',\n              description: `Unused import: ${importName}`,\n              suggestion: 'Remove unused import',\n              autoFixable: true\n            });\n          }\n        }\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectEmptyFunctions(file: string, content: string): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    const lines = content.split('\\n');\n    \n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n      \n      // Look for function declarations\n      if (line.match(/function\\s+\\w+|\\w+\\s*\\([^)]*\\)\\s*{\\s*}/)) {\n        if (line.includes('{}') || this.isFunctionEmpty(lines, i)) {\n          patterns.push({\n            type: TheaterType.EMPTY_FUNCTIONS,\n            file,\n            line: i + 1,\n            content: line.trim(),\n            severity: 'MEDIUM',\n            description: 'Empty function detected',\n            suggestion: 'Implement function or remove if not needed',\n            autoFixable: false\n          });\n        }\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectCommentedOutCode(file: string, lines: string[]): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    \n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i].trim();\n      \n      // Look for commented out code (not documentation)\n      if (line.startsWith('//') && this.looksLikeCode(line.substring(2).trim())) {\n        patterns.push({\n          type: TheaterType.COMMENT_OUT_CODE,\n          file,\n          line: i + 1,\n          content: line,\n          severity: 'LOW',\n          description: 'Commented out code detected',\n          suggestion: 'Remove commented code or add proper documentation',\n          autoFixable: true\n        });\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectDebugCode(file: string, lines: string[]): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    const debugPatterns = [\n      /debugger\\s*;/,\n      /console\\.time/,\n      /console\\.count/,\n      /console\\.trace/,\n      /alert\\s*\\(/,\n      /confirm\\s*\\(/,\n      /prompt\\s*\\(/\n    ];\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n      \n      for (const pattern of debugPatterns) {\n        if (pattern.test(line)) {\n          patterns.push({\n            type: TheaterType.DEBUG_CODE,\n            file,\n            line: i + 1,\n            content: line.trim(),\n            severity: 'HIGH',\n            description: 'Debug code detected in production',\n            suggestion: 'Remove debug statements',\n            autoFixable: true\n          });\n        }\n      }\n    }\n\n    return patterns;\n  }\n\n  private detectTestDataInProduction(file: string, lines: string[]): TheaterPattern[] {\n    const patterns: TheaterPattern[] = [];\n    const testDataPatterns = [\n      /test.*user/i,\n      /sample.*data/i,\n      /demo.*account/i,\n      /admin.*admin/i,\n      /password.*password/i,\n      /test@test\\.com/i\n    ];\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n      \n      for (const pattern of testDataPatterns) {\n        if (pattern.test(line)) {\n          patterns.push({\n            type: TheaterType.TEST_DATA_IN_PROD,\n            file,\n            line: i + 1,\n            content: line.trim(),\n            severity: 'MEDIUM',\n            description: 'Test data detected in production code',\n            suggestion: 'Replace with proper production data or configuration',\n            autoFixable: false\n          });\n        }\n      }\n    }\n\n    return patterns;\n  }\n\n  private calculateTheaterScore(patterns: TheaterPattern[]): number {\n    if (patterns.length === 0) return 100;\n\n    const severityWeights = {\n      'LOW': 1,\n      'MEDIUM': 3,\n      'HIGH': 5,\n      'CRITICAL': 10\n    };\n\n    const totalPenalty = patterns.reduce((sum, pattern) => {\n      return sum + severityWeights[pattern.severity];\n    }, 0);\n\n    // Scale based on file count to normalize score\n    const maxPenalty = this.sourceFiles.length * 50; // Theoretical max if every file had 5 critical issues\n    const score = Math.max(0, 100 - (totalPenalty / maxPenalty) * 100);\n    \n    return Math.round(score);\n  }\n\n  private generateSummary(patterns: TheaterPattern[]) {\n    const theaterFiles = new Set(patterns.map(p => p.file)).size;\n    const severityCounts = patterns.reduce((counts, pattern) => {\n      counts[pattern.severity] = (counts[pattern.severity] || 0) + 1;\n      return counts;\n    }, {} as Record<string, number>);\n\n    let overallSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';\n    if (severityCounts.CRITICAL > 0) overallSeverity = 'CRITICAL';\n    else if (severityCounts.HIGH > 5) overallSeverity = 'HIGH';\n    else if (severityCounts.MEDIUM > 10) overallSeverity = 'MEDIUM';\n\n    return {\n      totalFiles: this.sourceFiles.length,\n      theaterFiles,\n      patternCount: patterns.length,\n      severity: overallSeverity\n    };\n  }\n\n  private generateRecommendations(patterns: TheaterPattern[]): string[] {\n    const recommendations: string[] = [];\n    const typeCount = patterns.reduce((counts, pattern) => {\n      counts[pattern.type] = (counts[pattern.type] || 0) + 1;\n      return counts;\n    }, {} as Record<TheaterType, number>);\n\n    // Generate recommendations based on most common issues\n    const sortedTypes = Object.entries(typeCount)\n      .sort(([,a], [,b]) => b - a)\n      .slice(0, 5);\n\n    for (const [type, count] of sortedTypes) {\n      switch (type as TheaterType) {\n        case TheaterType.CONSOLE_LOG:\n          recommendations.push(`PRIORITY: Remove ${count} console statements and implement proper logging`);\n          break;\n        case TheaterType.TODO_COMMENT:\n          recommendations.push(`HIGH: Address ${count} TODO comments - complete implementations or create issues`);\n          break;\n        case TheaterType.FAKE_IMPLEMENTATION:\n          recommendations.push(`CRITICAL: Replace ${count} fake implementations with real functionality`);\n          break;\n        case TheaterType.HARDCODED_VALUES:\n          recommendations.push(`HIGH: Move ${count} hardcoded values to configuration`);\n          break;\n        case TheaterType.DEBUG_CODE:\n          recommendations.push(`HIGH: Remove ${count} debug statements from production code`);\n          break;\n        default:\n          recommendations.push(`Address ${count} instances of ${type}`);\n      }\n    }\n\n    if (recommendations.length === 0) {\n      recommendations.push('✓ No theater patterns detected - code appears production ready');\n    }\n\n    return recommendations;\n  }\n\n  private findSourceFiles(): string[] {\n    const files: string[] = [];\n    \n    const walkDir = (dir: string) => {\n      try {\n        const items = readdirSync(dir);\n        for (const item of items) {\n          const fullPath = join(dir, item);\n          \n          // Skip excluded patterns\n          if (this.excludePatterns.some(pattern => pattern.test(fullPath))) {\n            continue;\n          }\n\n          const stat = statSync(fullPath);\n          if (stat.isDirectory()) {\n            walkDir(fullPath);\n          } else if (['.ts', '.js', '.tsx', '.jsx'].includes(extname(item))) {\n            files.push(fullPath);\n          }\n        }\n      } catch {\n        // Directory doesn't exist or can't be read\n      }\n    };\n\n    walkDir(this.projectRoot);\n    return files;\n  }\n\n  private isFunctionEmpty(lines: string[], startIndex: number): boolean {\n    let braceCount = 0;\n    let hasContent = false;\n    \n    for (let i = startIndex; i < lines.length; i++) {\n      const line = lines[i].trim();\n      \n      braceCount += (line.match(/{/g) || []).length;\n      braceCount -= (line.match(/}/g) || []).length;\n      \n      if (line && !line.includes('{') && !line.includes('}') && !line.startsWith('//')) {\n        hasContent = true;\n      }\n      \n      if (braceCount === 0) {\n        break;\n      }\n    }\n    \n    return !hasContent;\n  }\n\n  private looksLikeCode(text: string): boolean {\n    const codeIndicators = [\n      /\\w+\\s*\\(/,           // Function calls\n      /\\w+\\s*=/,            // Assignments\n      /\\{|\\}/,              // Braces\n      /;\\s*$/,              // Semicolon at end\n      /if\\s*\\(/,            // If statements\n      /for\\s*\\(/,           // For loops\n      /return\\s+/,          // Return statements\n      /\\w+\\./,              // Property access\n      /\\w+\\[/               // Array access\n    ];\n    \n    return codeIndicators.some(pattern => pattern.test(text));\n  }\n}
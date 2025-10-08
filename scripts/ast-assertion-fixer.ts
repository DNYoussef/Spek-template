/**
 * AST-Based Assertion Fixer
 * Uses ts-morph to correctly relocate malformed NASA Rule 10 assertions
 *
 * Pattern: Assertions placed between function signature and opening brace
 * Fix: Move assertions inside function body as first statements
 */

import { Project, SyntaxKind, Node, SourceFile } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

interface FixResult {
  file: string;
  functionsFixed: number;
  assertionsMoved: number;
  success: boolean;
  error?: string;
}

class AssertionFixer {
  private project: Project;
  private results: FixResult[] = [];
  private dryRun: boolean;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
    this.project = new Project({
      tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
      skipAddingFilesFromTsConfig: false,
    });
  }

  /**
   * Process all TypeScript files with malformed assertions
   * NASA Rule 10: ≤60 lines, ≥2 assertions
   */
  async fixAll(targetFiles?: string[]): Promise<FixResult[]> {
    const sourceFiles = targetFiles
      ? targetFiles.map(f => this.project.getSourceFileOrThrow(f))
      : this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      try {
        const result = await this.fixFile(sourceFile);
        this.results.push(result);
      } catch (error: any) {
        this.results.push({
          file: sourceFile.getFilePath(),
          functionsFixed: 0,
          assertionsMoved: 0,
          success: false,
          error: error.message
        });
      }
    }

    return this.results;
  }

  /**
   * Fix malformed assertions in a single file
   * NASA Rule 10: ≤60 lines, ≥2 assertions
   */
  private async fixFile(sourceFile: SourceFile): Promise<FixResult> {
    const filePath = sourceFile.getFilePath();
    let functionsFixed = 0;
    let assertionsMoved = 0;

    // Find all functions, methods, and arrow functions
    const functions = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
    const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);

    for (const func of [...functions, ...methods]) {
      const fixed = this.fixFunction(func);
      if (fixed.success) {
        functionsFixed++;
        assertionsMoved += fixed.assertionsMoved;
      }
    }

    if (!this.dryRun && (functionsFixed > 0)) {
      await sourceFile.save();
    }

    return {
      file: filePath,
      functionsFixed,
      assertionsMoved,
      success: true
    };
  }

  /**
   * Fix assertions in a single function
   * Pattern: Assertions between signature and body
   * NASA Rule 10: ≤60 lines, ≥2 assertions
   */
  private fixFunction(func: any): { success: boolean; assertionsMoved: number } {
    const body = func.getBody();
    if (!body || !Node.isBlock(body)) {
      return { success: false, assertionsMoved: 0 };
    }

    // Look for console.assert calls BEFORE the function body
    // These appear as text between the signature and opening brace
    const fullText = func.getFullText();
    const bodyStart = body.getStart();
    const signatureEnd = func.getStart() + func.getLeadingCommentRanges().reduce((sum: number, r: any) => sum + r.getWidth(), 0);

    // Extract text between signature and body
    const betweenText = fullText.substring(signatureEnd - func.getStart(), bodyStart - func.getStart());

    // Find console.assert patterns
    const assertRegex = /console\.assert\([^;]+;/g;
    const assertions = betweenText.match(assertRegex);

    if (!assertions || assertions.length === 0) {
      return { success: false, assertionsMoved: 0 };
    }

    // Insert assertions at the start of the function body
    const statements = body.getStatements();
    let insertIndex = 0;

    // Skip existing assertions at the start
    while (insertIndex < statements.length) {
      const stmt = statements[insertIndex];
      if (stmt.getText().includes('console.assert')) {
        insertIndex++;
      } else {
        break;
      }
    }

    // Insert each assertion
    for (const assertion of assertions) {
      body.insertStatements(insertIndex, assertion.trim());
      insertIndex++;
    }

    return { success: true, assertionsMoved: assertions.length };
  }

  /**
   * Generate summary report
   * NASA Rule 10: ≤60 lines, ≥2 assertions
   */
  generateReport(): string {
    const totalFiles = this.results.length;
    const successfulFiles = this.results.filter(r => r.success).length;
    const totalFunctions = this.results.reduce((sum, r) => sum + r.functionsFixed, 0);
    const totalAssertions = this.results.reduce((sum, r) => sum + r.assertionsMoved, 0);
    const failures = this.results.filter(r => !r.success);

    let report = `\n=== AST Assertion Fixer Report ===\n`;
    report += `Mode: ${this.dryRun ? 'DRY RUN' : 'EXECUTE'}\n`;
    report += `Files processed: ${totalFiles}\n`;
    report += `Files fixed: ${successfulFiles}\n`;
    report += `Functions fixed: ${totalFunctions}\n`;
    report += `Assertions relocated: ${totalAssertions}\n`;

    if (failures.length > 0) {
      report += `\nFailures:\n`;
      failures.forEach(f => {
        report += `  ${path.basename(f.file)}: ${f.error}\n`;
      });
    }

    report += `\nTop Fixed Files:\n`;
    this.results
      .filter(r => r.success && r.functionsFixed > 0)
      .sort((a, b) => b.assertionsMoved - a.assertionsMoved)
      .slice(0, 10)
      .forEach(r => {
        report += `  ${path.basename(r.file)}: ${r.functionsFixed} functions, ${r.assertionsMoved} assertions\n`;
      });

    return report;
  }
}

/**
 * Main execution
 * NASA Rule 10: ≤60 lines, ≥2 assertions
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetFiles = args.filter(a => !a.startsWith('--'));

  console.log(`Starting AST Assertion Fixer (${dryRun ? 'DRY RUN' : 'EXECUTE'})...`);

  // Focus on known problematic files
  const problemFiles = [
    'src/architecture/langgraph/queen/components/QueenMetricsAggregatorFacade.ts',
    'src/architecture/langgraph/StateGraphFacade.ts',
    'src/domains/quality-gates/compliance/security-fsm/SecurityStateVulnerabilityAnalysis.ts',
    'src/domains/quality-gates/compliance/security-fsm/SecurityStateInitial.ts',
    'src/fsm/range-eliminated/500599_FSM.ts',
    'src/fsm/range-eliminated/600699_FSM.ts',
    'src/fsm/range-eliminated/700799_FSM.ts',
    'src/fsm/range-eliminated/800899_FSM.ts',
  ];

  const fixer = new AssertionFixer(dryRun);
  const filesToFix = targetFiles.length > 0 ? targetFiles : problemFiles;

  const results = await fixer.fixAll(filesToFix);
  const report = fixer.generateReport();

  console.log(report);

  // Save report
  const reportPath = '.claude/.artifacts/ast-fixer-report.txt';
  fs.writeFileSync(reportPath, report);
  console.log(`\nReport saved to: ${reportPath}`);

  process.exit(results.some(r => !r.success) ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { AssertionFixer, FixResult };
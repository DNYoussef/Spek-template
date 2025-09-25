#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const SPEK_TEMPLATE_DIR = 'C:\\Users\\17175\\Desktop\\spek template';
const REALTOR_APP_DIR = 'C:\\Users\\17175\\Desktop\\realtor-app-project';

// Patterns for files that belong to realtor project
const REALTOR_PATTERNS = [
  /queen/i,
  /princess/i,
  /drone/i,
  /phase-\d+/i,
  /realtor/i,
  /agent-work/,
  /spawned-agents/,
  /bridge-reports/,
  /real-executions/,
  /context-dna/,
  /validation-report/,
  /THEATER/i,
  /execution.*\.js$/,
  /demo.*\.js$/,
  /spawn.*\.js$/,
  /test.*queen.*\.js$/
];

class FinalCleanup {
  constructor() {
    this.report = {
      found: [],
      moved: [],
      errors: [],
      summary: { total: 0, moved: 0, errors: 0 }
    };
  }

  async findRealtorFiles(dir, relativePath = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const itemRelativePath = path.join(relativePath, item);

      if (fs.statSync(fullPath).isDirectory()) {
        // Skip certain directories that should stay in SPEK
        if (['node_modules', '.git', 'src/flow', 'analyzer', 'tests', 'lib'].includes(item)) {
          continue;
        }
        await this.findRealtorFiles(fullPath, itemRelativePath);
      } else {
        // Check if this file matches realtor patterns
        const shouldMove = REALTOR_PATTERNS.some(pattern =>
          pattern.test(itemRelativePath) || pattern.test(item)
        );

        if (shouldMove) {
          this.report.found.push({
            path: itemRelativePath,
            fullPath: fullPath,
            reason: 'Matches realtor pattern'
          });
        }
      }
    }
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  moveFile(sourceFullPath, relativePath) {
    try {
      const destPath = path.join(REALTOR_APP_DIR, relativePath);

      // Ensure destination directory exists
      this.ensureDirectoryExists(path.dirname(destPath));

      // Move the file
      fs.renameSync(sourceFullPath, destPath);

      this.report.moved.push({
        from: relativePath,
        to: destPath
      });

      console.log(`Moved: ${relativePath} -> ${destPath}`);
      return true;
    } catch (error) {
      this.report.errors.push({
        file: relativePath,
        error: error.message
      });
      console.error(`Error moving ${relativePath}: ${error.message}`);
      return false;
    }
  }

  async cleanup() {
    console.log('Scanning for remaining realtor files...');

    // Find all realtor files in SPEK template
    await this.findRealtorFiles(SPEK_TEMPLATE_DIR);

    this.report.summary.total = this.report.found.length;

    console.log(`Found ${this.report.found.length} files to move`);

    // Move each file
    for (const file of this.report.found) {
      const success = this.moveFile(file.fullPath, file.path);
      if (success) {
        this.report.summary.moved++;
      } else {
        this.report.summary.errors++;
      }
    }

    // Save report
    const reportPath = path.join(SPEK_TEMPLATE_DIR, 'scripts', 'final-cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));

    console.log('\n=== FINAL CLEANUP COMPLETE ===');
    console.log(`Files found: ${this.report.summary.total}`);
    console.log(`Files moved: ${this.report.summary.moved}`);
    console.log(`Errors: ${this.report.summary.errors}`);
    console.log(`Report saved to: ${reportPath}`);
  }

  printReport() {
    if (this.report.moved.length > 0) {
      console.log('\n? MOVED FILES:');
      this.report.moved.forEach((item, index) => {
        console.log(`${index + 1}. ${item.from}`);
      });
    }

    if (this.report.errors.length > 0) {
      console.log('\n[FAIL] ERRORS:');
      this.report.errors.forEach((item, index) => {
        console.log(`${index + 1}. ${item.file}: ${item.error}`);
      });
    }
  }
}

// Main execution
async function main() {
  const cleanup = new FinalCleanup();

  try {
    await cleanup.cleanup();
    cleanup.printReport();

    console.log('\n[OK] Final cleanup completed successfully!');
  } catch (error) {
    console.error(`\n[FAIL] Final cleanup failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = FinalCleanup;
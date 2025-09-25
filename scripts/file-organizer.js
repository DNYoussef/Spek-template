#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const SPEK_TEMPLATE_DIR = 'C:\\Users\\17175\\Desktop\\spek template';
const REALTOR_APP_DIR = 'C:\\Users\\17175\\Desktop\\realtor-app-project';
const STAGED_FILES_PATH = path.join(SPEK_TEMPLATE_DIR, 'staged-files.txt');

// File categorization rules
const REALTOR_PATTERNS = [
  /realtor/i,
  /phase/i,
  /princess/i,
  /queen/i,
  /drone/i,
  /agent-work/,
  /bridge-reports/,
  /drone-spawns/,
  /real-executions/,
  /spawned-agents/,
  /demo-real-agent/,
  /deploy-real-swarm/,
  /real-agent-bridge/,
  /test-real-swarm/,
  /RealQueenPrincessDrone/
];

const SPEK_SYSTEM_PATTERNS = [
  /^src\/flow\//,
  /^\.claude-flow\//,
  /^config\//,
  /^docs\/.*\.md$/ // Generic documentation stays in SPEK
];

class FileOrganizer {
  constructor() {
    this.moveReport = {
      movedToRealtor: [],
      stayedInSpek: [],
      errors: [],
      summary: {
        totalFiles: 0,
        movedFiles: 0,
        systemFiles: 0,
        errors: 0
      }
    };
  }

  parseGitStatus(gitStatusLine) {
    // Parse git status format: "M  path/to/file" or "A  path/to/file"
    const match = gitStatusLine.match(/^[AMR?]+\s+(.+)$/);
    if (match) {
      return match[1].trim();
    }
    return null;
  }

  categorizeFile(filePath) {
    // Check if it belongs to realtor project
    const isRealtorFile = REALTOR_PATTERNS.some(pattern => pattern.test(filePath));

    // Check if it's a core SPEK system file
    const isSpekSystemFile = SPEK_SYSTEM_PATTERNS.some(pattern => pattern.test(filePath));

    // Special cases
    if (filePath.startsWith('realtor-app-project/')) {
      return 'realtor';
    }

    if (filePath.includes('.artifacts') && !isSpekSystemFile) {
      return 'realtor'; // Most artifacts are from realtor work
    }

    if (isSpekSystemFile) {
      return 'spek';
    }

    if (isRealtorFile) {
      return 'realtor';
    }

    // Default to staying in SPEK for system files
    return 'spek';
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  }

  moveFile(sourcePath, destPath) {
    try {
      const sourceFullPath = path.resolve(SPEK_TEMPLATE_DIR, sourcePath);
      const destFullPath = path.resolve(destPath);

      // Check if source exists
      if (!fs.existsSync(sourceFullPath)) {
        console.log(`Source file does not exist: ${sourceFullPath}`);
        return false;
      }

      // Ensure destination directory exists
      this.ensureDirectoryExists(path.dirname(destFullPath));

      // Move the file
      fs.renameSync(sourceFullPath, destFullPath);
      console.log(`Moved: ${sourcePath} -> ${destFullPath}`);
      return true;
    } catch (error) {
      console.error(`Error moving ${sourcePath}: ${error.message}`);
      this.moveReport.errors.push({
        file: sourcePath,
        error: error.message
      });
      return false;
    }
  }

  async organize() {
    console.log('Starting file organization...');

    try {
      // Read staged files
      const stagedContent = fs.readFileSync(STAGED_FILES_PATH, 'utf8');
      const lines = stagedContent.split('\n').filter(line => line.trim());

      this.moveReport.summary.totalFiles = lines.length;

      console.log(`Processing ${lines.length} lines from staged-files.txt`);

      for (const line of lines) {
        const filePath = this.parseGitStatus(line);
        if (!filePath) {
          console.log(`Skipped line: ${line}`);
          continue;
        }

        console.log(`Processing file: ${filePath}`);
        const category = this.categorizeFile(filePath);
        console.log(`Category: ${category}`);

        if (category === 'realtor') {
          // Move to realtor project
          const destPath = path.join(REALTOR_APP_DIR, filePath);
          const success = this.moveFile(filePath, destPath);

          if (success) {
            this.moveReport.movedToRealtor.push({
              originalPath: filePath,
              newPath: destPath,
              reason: 'Realtor project file'
            });
            this.moveReport.summary.movedFiles++;
          }
        } else {
          // Stay in SPEK template
          this.moveReport.stayedInSpek.push({
            path: filePath,
            reason: 'SPEK system file'
          });
          this.moveReport.summary.systemFiles++;
        }
      }

      this.moveReport.summary.errors = this.moveReport.errors.length;

      // Save move report
      const reportPath = path.join(SPEK_TEMPLATE_DIR, 'scripts', 'move-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(this.moveReport, null, 2));

      console.log('\n=== FILE ORGANIZATION COMPLETE ===');
      console.log(`Total files processed: ${this.moveReport.summary.totalFiles}`);
      console.log(`Files moved to realtor project: ${this.moveReport.summary.movedFiles}`);
      console.log(`Files kept in SPEK system: ${this.moveReport.summary.systemFiles}`);
      console.log(`Errors: ${this.moveReport.summary.errors}`);
      console.log(`\nDetailed report saved to: ${reportPath}`);

      return this.moveReport;

    } catch (error) {
      console.error(`Fatal error during organization: ${error.message}`);
      throw error;
    }
  }

  printReport() {
    console.log('\n=== DETAILED MOVE REPORT ===');

    if (this.moveReport.movedToRealtor.length > 0) {
      console.log('\n? MOVED TO REALTOR PROJECT:');
      this.moveReport.movedToRealtor.forEach((item, index) => {
        console.log(`${index + 1}. ${item.originalPath} -> ${item.newPath}`);
      });
    }

    if (this.moveReport.stayedInSpek.length > 0) {
      console.log('\n? STAYED IN SPEK SYSTEM:');
      this.moveReport.stayedInSpek.forEach((item, index) => {
        console.log(`${index + 1}. ${item.path} (${item.reason})`);
      });
    }

    if (this.moveReport.errors.length > 0) {
      console.log('\n[FAIL] ERRORS:');
      this.moveReport.errors.forEach((item, index) => {
        console.log(`${index + 1}. ${item.file}: ${item.error}`);
      });
    }
  }
}

// Main execution
async function main() {
  const organizer = new FileOrganizer();

  try {
    await organizer.organize();
    organizer.printReport();

    console.log('\n[OK] File organization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`\n[FAIL] File organization failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = FileOrganizer;
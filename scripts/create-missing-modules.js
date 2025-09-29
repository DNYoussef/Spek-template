#!/usr/bin/env node

/**
 * Create Missing Modules Script
 * Creates stub files for all TS2307 (module not found) errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Creating missing modules from build errors...\n');

// Get build errors
let buildOutput = '';
try {
  buildOutput = execSync('npm run build 2>&1', {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024
  });
} catch (error) {
  buildOutput = error.stdout || '';
}

// Parse TS2307 errors with file paths
const lines = buildOutput.split('\n');
const missingModules = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Match pattern: src/path/file.ts(line,col): error TS2307: Cannot find module 'module-path'
  const match = line.match(/^(.+\.ts)\(\d+,\d+\): error TS2307: Cannot find module '([^']+)'/);

  if (match) {
    const importingFile = match[1];
    const modulePath = match[2];

    // Only handle relative imports
    if (modulePath.startsWith('.')) {
      missingModules.push({
        importingFile: importingFile.replace(/\\/g, '/'),
        modulePath: modulePath
      });
    }
  }
}

console.log(`Found ${missingModules.length} missing module references\n`);

// Deduplicate by resolved path
const modulesToCreate = new Map();

missingModules.forEach(({ importingFile, modulePath }) => {
  const importingDir = path.dirname(importingFile);
  let fullPath = path.resolve(importingDir, modulePath);

  // Normalize path
  fullPath = fullPath.replace(/\\/g, '/');

  // Add .ts extension if missing
  if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx') && !fullPath.endsWith('.js')) {
    fullPath += '.ts';
  }

  if (!modulesToCreate.has(fullPath)) {
    modulesToCreate.set(fullPath, { importingFile, modulePath });
  }
});

console.log(`${modulesToCreate.size} unique modules to create\n`);

// Create missing files
let created = 0;
let skipped = 0;
let errors = 0;

modulesToCreate.forEach(({ importingFile, modulePath }, fullPath) => {
  try {
    // Check if file already exists
    if (fs.existsSync(fullPath)) {
      skipped++;
      return;
    }

    const fileName = path.basename(fullPath);
    const className = fileName.replace(/\.(ts|tsx|js)$/, '').replace(/-/g, '');

    // Create directory if needed
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Generate appropriate content
    let content = '';

    if (fileName.includes('Facade')) {
      // Facade pattern
      content = `/**
 * ${className} - Auto-generated facade
 * TODO: Implement actual functionality
 */

export class ${className} {
  private config: any;

  constructor(config?: any) {
    this.config = config || {};
  }

  async initialize(): Promise<void> {
    // TODO: Implement initialization
  }

  async cleanup(): Promise<void> {
    // TODO: Implement cleanup
  }
}

export default ${className};
`;
    } else if (fileName.includes('Types') || fileName.includes('types')) {
      // Type definitions
      content = `/**
 * ${className} - Auto-generated type definitions
 * TODO: Define proper types
 */

export interface ${className}Config {
  [key: string]: any;
}

export interface ${className}State {
  [key: string]: any;
}

export interface ${className}Result {
  success: boolean;
  data?: any;
  error?: string;
}

export enum ${className}Status {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type ${className}Type = any;

export default {
  ${className}Config,
  ${className}State,
  ${className}Result,
  ${className}Status
};
`;
    } else if (fileName.includes('Handler') || fileName.includes('Manager')) {
      // Handler/Manager pattern
      content = `/**
 * ${className} - Auto-generated handler
 * TODO: Implement actual functionality
 */

export class ${className} {
  constructor(config?: any) {
    // TODO: Initialize
  }

  async handle(context: any): Promise<any> {
    // TODO: Implement handler logic
    return { success: true };
  }

  async process(data: any): Promise<any> {
    // TODO: Implement processing
    return data;
  }
}

export default ${className};
`;
    } else {
      // Generic class
      content = `/**
 * ${className} - Auto-generated module
 * TODO: Implement actual functionality
 */

export class ${className} {
  constructor(config?: any) {
    // TODO: Initialize
  }
}

// Export any additional items that might be imported
export const ${className.toLowerCase()} = new ${className}();
export default ${className};
`;
    }

    // Write the file
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Created: ${fullPath}`);
    created++;

  } catch (error) {
    console.error(`✗ Error creating ${fullPath}: ${error.message}`);
    errors++;
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log('Summary:');
console.log(`- Created: ${created} files`);
console.log(`- Skipped (exist): ${skipped} files`);
console.log(`- Errors: ${errors}`);
console.log(`\nRun 'npm run build' to check remaining errors`);

// If significant files were created, show next steps
if (created > 0) {
  console.log('\nNext steps:');
  console.log('1. npm run build');
  console.log('2. Review auto-generated files and implement TODOs');
  console.log('3. Run type checking: npm run typecheck');
}
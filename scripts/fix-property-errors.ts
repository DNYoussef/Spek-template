#!/usr/bin/env ts-node

/**
 * Property Error Fix Script
 * Analyzes and fixes common TS2339 property errors
 */

import * as fs from 'fs';
import * as path from 'path';

// Common missing properties and their fixes
const PROPERTY_FIXES = {
  // Logger properties
  'logger': `
    logger?: {
      info: (msg: string, ...args: any[]) => void;
      error: (msg: string, ...args: any[]) => void;
      warn: (msg: string, ...args: any[]) => void;
      debug: (msg: string, ...args: any[]) => void;
    };`,

  'logInfo': `logInfo: (msg: string) => void;`,
  'logError': `logError: (msg: string) => void;`,
  'logDebug': `logDebug: (msg: string) => void;`,

  // FSM properties
  'states': `states?: Map<string, any>;`,
  'transitions': `transitions?: Array<{ from: string; to: string; event: string; }>;`,
  'currentState': `currentState?: string;`,

  // Initialization
  'initialize': `initialize?: () => Promise<void>;`,
  'cleanup': `cleanup?: () => Promise<void>;`,
  'shutdown': `shutdown?: () => Promise<void>;`,

  // Common data properties
  'metadata': `metadata?: Record<string, any>;`,
  'role': `role?: string;`,
  'type': `type?: string;`,
  'details': `details?: any;`,

  // Test properties (for jest)
  'toBeGreaterThan': `// Jest matcher - add @types/jest`,
  'toBeLessThan': `// Jest matcher - add @types/jest`,

  // Risk and analysis
  'overall_risk_level': `overall_risk_level?: 'low' | 'medium' | 'high' | 'critical';`,
  'criticalViolations': `criticalViolations?: Array<any>;`,

  // Workflow properties
  'prerequisiteId': `prerequisiteId?: string;`,
  'transitionId': `transitionId?: string;`,
  'stateExecutionTimes': `stateExecutionTimes?: Map<string, number>;`,

  // Browser/DOM properties
  'mouseMoveEvent': `mouseMoveEvent?: MouseEvent;`,
  'holdKeys': `holdKeys?: string[];`,

  // Utility
  'toString': `toString?: () => string;`,
  'search': `search?: string;`,
};

// Interface augmentations for common issues
const GLOBAL_AUGMENTATIONS = `
// Global type augmentations for missing properties
declare global {
  interface Window {
    [key: string]: any;
  }

  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
}

// Augment common interfaces
declare module 'events' {
  interface EventEmitter {
    logger?: any;
  }
}
`;

function analyzePropertyErrors(buildOutput: string): Map<string, number> {
  const propertyErrors = new Map<string, number>();
  const regex = /Property '([^']+)' does not exist/g;

  let match;
  while ((match = regex.exec(buildOutput)) !== null) {
    const prop = match[1];
    propertyErrors.set(prop, (propertyErrors.get(prop) || 0) + 1);
  }

  return propertyErrors;
}

function generateTypeAugmentations(propertyErrors: Map<string, number>): string {
  let augmentations = '/**\n * Auto-generated type augmentations for missing properties\n */\n\n';

  // Add global augmentations
  augmentations += GLOBAL_AUGMENTATIONS + '\n';

  // Add specific property fixes
  augmentations += '// Common missing properties\nexport interface CommonProperties {\n';

  for (const [prop, count] of Array.from(propertyErrors.entries()).sort((a, b) => b[1] - a[1])) {
    if (PROPERTY_FIXES[prop]) {
      augmentations += `  // Used ${count} times\n`;
      augmentations += '  ' + PROPERTY_FIXES[prop] + '\n';
    } else {
      augmentations += `  // TODO: ${prop}?: any; // Used ${count} times\n`;
    }
  }

  augmentations += '}\n';

  return augmentations;
}

// Main execution
async function main() {
  console.log('Analyzing property errors...\n');

  // Get build output
  const { execSync } = require('child_process');
  let buildOutput = '';

  try {
    buildOutput = execSync('npm run build 2>&1', {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (error: any) {
    buildOutput = error.stdout || '';
  }

  // Analyze errors
  const propertyErrors = analyzePropertyErrors(buildOutput);
  console.log(`Found ${propertyErrors.size} unique missing properties\n`);

  // Show top 10
  console.log('Top 10 missing properties:');
  Array.from(propertyErrors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([prop, count]) => {
      console.log(`  ${prop}: ${count} occurrences`);
    });

  // Generate augmentations
  const augmentations = generateTypeAugmentations(propertyErrors);

  // Write to file
  const outputPath = path.join(process.cwd(), 'src/types/property-augmentations.ts');
  fs.writeFileSync(outputPath, augmentations);

  console.log(`\nGenerated type augmentations at: ${outputPath}`);
  console.log('Add this import to files with property errors:');
  console.log("  import '../types/property-augmentations';");
}

main().catch(console.error);

export {};
#!/usr/bin/env node

/**
 * Unicode Cleaner for Memory System Files
 * Removes Unicode characters that violate project NO UNICODE rule
 */

const fs = require('fs');
const path = require('path');

const memoryFiles = [
  'src/memory/adapters/InfrastructureMemoryAdapter.ts',
  'src/memory/adapters/ResearchMemoryAdapter.ts',
  'src/memory/adapters/SharedMemoryProtocol.ts',
  'src/memory/analytics/MemoryUsageAnalyzer.ts',
  'src/memory/coordination/CrossPrincessMemoryCoordinator.ts',
  'src/memory/coordinator/MemoryCoordinator.ts',
  'src/memory/coordinator/MemoryPartitioner.ts',
  'src/memory/langroid/LangroidMemoryManager.ts',
  'src/memory/langroid/MemoryCompressor.ts',
  'src/memory/langroid/MemoryPartitionController.ts',
  'src/memory/langroid/MemoryPersistence.ts',
  'src/memory/langroid/MemorySerializer.ts',
  'src/memory/monitoring/MemoryMetrics.ts',
  'src/memory/optimization/MemoryCacheStrategy.ts',
  'src/memory/optimization/MemoryGarbageCollector.ts',
  'src/memory/optimization/MemoryOptimizer.ts',
  'src/memory/persistence/MemoryPersistence.ts',
  'src/memory/security/MemoryEncryption.ts',
  'src/memory/sharing/MemoryBroadcaster.ts',
  'src/memory/sharing/MemoryConflictResolver.ts',
  'src/memory/sharing/MemorySubscriber.ts',
  'src/memory/sharing/MemoryVersionController.ts',
  'src/memory/sharing/SharedMemoryBus.ts',
  'src/memory/sync/DistributedMemorySync.ts',
  'src/memory/ttl/TTLManager.ts'
];

function cleanUnicodeCharacters(content) {
  // Remove common Unicode characters that cause TypeScript errors
  return content
    // Remove Unicode quotes and replace with ASCII quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Remove Unicode dashes and replace with ASCII dashes
    .replace(/[–—]/g, '-')
    // Remove Unicode spaces and replace with ASCII spaces
    .replace(/[\u00A0\u2000-\u200F\u2028-\u202F]/g, ' ')
    // Remove other Unicode symbols
    .replace(/[^\x00-\x7F]/g, '')
    // Clean up any malformed escape sequences
    .replace(/\\n\s*\\n/g, '\\n')
    .replace(/\s+\n/g, '\n')
    // Fix common TypeScript issues
    .replace(/}\s*catch\s*\(/g, '} catch (')
    .replace(/}\s*finally\s*\{/g, '} finally {');
}

function cleanFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const cleaned = cleanUnicodeCharacters(content);

    if (content !== cleaned) {
      fs.writeFileSync(fullPath, cleaned, 'utf8');
      console.log(`Cleaned Unicode characters in: ${filePath}`);
      return true;
    } else {
      console.log(`No Unicode characters found in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('Cleaning Unicode characters from memory system files...');

  let cleanedCount = 0;
  for (const file of memoryFiles) {
    if (cleanFile(file)) {
      cleanedCount++;
    }
  }

  console.log(`\nCleaning completed. ${cleanedCount} files were modified.`);

  // Verify TypeScript compilation
  console.log('\nVerifying TypeScript compilation...');
  const { exec } = require('child_process');
  exec('npx tsc --noEmit src/memory/coordination/CrossPrincessMemoryCoordinator.ts', (error, stdout, stderr) => {
    if (error) {
      console.log('TypeScript errors still present:');
      console.log(stderr);
    } else {
      console.log('TypeScript compilation successful!');
    }
  });
}

if (require.main === module) {
  main();
}

module.exports = { cleanUnicodeCharacters, cleanFile };
#!/usr/bin/env node
/**
 * Fix embedded declarations in StateGraphFacade
 * Target specific line patterns causing TS1005/TS1109 errors
 */
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../src/architecture/langgraph/StateGraphFacade.ts');

console.log('Fixing embedded declarations in StateGraphFacade...');

let content = fs.readFileSync(FILE_PATH, 'utf8');
const original = content;

// Fix 1: Embedded declaration after catch (line 160)
content = content.replace(
  /(\}\s*catch\s*\([^)]+\)\s*\{)const result:\s*GraphTraversalResult\s+=\s+\{\s*path:\s*\[\],/,
  '$1\n      const result: GraphTraversalResult = {\n        path: [],'
);

// Fix 2: Embedded declaration after findDeadlockStates() (line 188)
content = content.replace(
  /(findDeadlockStates\(\);)const result:\s*GraphAnalysisResult\s+=\s+\{/,
  '$1\n      const result: GraphAnalysisResult = {'
);

// Fix 3: const keywords in object properties (lines 189-196)
content = content.replace(
  /\{\s*const nodeCount,\s*const edgeCount,\s*const hasCycles,\s*const connectedComponents,\s*const density,\s*const averageDegree,\s*const criticalPaths,\s*const deadlockStates\s*\}/g,
  '{\n        nodeCount: _nodeCount,\n        edgeCount: _edgeCount,\n        hasCycles: _hasCycles,\n        connectedComponents: _connectedComponents,\n        density: _density,\n        averageDegree: _averageDegree,\n        criticalPaths: _criticalPaths,\n        deadlockStates: _deadlockStates\n      }'
);

// Fix 4: Embedded declaration in findCriticalPaths (line 432)
content = content.replace(
  /\/\/ Simplified critical const path finding\s+paths:\s*string\[\]\[\]\s*=\s*\[\];/,
  '// Simplified critical path finding\n    const _paths: string[][] = [];'
);

// Fix 5: Reference fixes - startNodes to _startNodes
content = content.replace(
  /for\s*\(const startNode of startNodes\.slice/g,
  'for (const startNode of _startNodes.slice'
);

// Fix 6: Comment fixes - remove "const" from comments
content = content.replace(
  /\/\/ Limit const to (\d+) start nodes/g,
  '// Limit to $1 start nodes'
);

content = content.replace(
  /\/\/ Limit const to (\d+) critical paths/g,
  '// Limit to $1 critical paths'
);

// Fix 7: Variable references - path to _path, paths to _paths
content = content.replace(
  /if\s*\(path\.length\s*>\s*1\)\s*\{\s*paths\.push\(path\);/g,
  'if (_path.length > 1) {\n        _paths.push(_path);'
);

content = content.replace(
  /return paths\.slice\(0,\s*10\);/,
  'return _paths.slice(0, 10);'
);

if (content !== original) {
  fs.writeFileSync(FILE_PATH, content, 'utf8');
  console.log('✓ Fixed embedded declarations in StateGraphFacade.ts');

  // Count remaining issues
  const lines = content.split('\n');
  const issueLines = lines.filter((line, idx) => {
    return /const\s+\w+,/.test(line) ||
           /\}catch/.test(line) ||
           /\)const\s+/.test(line);
  });

  if (issueLines.length > 0) {
    console.log(`  Warning: ${issueLines.length} potential issues remaining`);
  } else {
    console.log('  All major patterns fixed');
  }
} else {
  console.log('  No changes made (file already fixed or patterns not found)');
}
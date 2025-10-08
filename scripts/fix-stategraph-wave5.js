#!/usr/bin/env node
/**
 * Wave 5: Fix remaining StateGraphFacade embedded declarations
 * Target: Lines 151-160 with embedded const declarations
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/architecture/langgraph/StateGraphFacade.ts');

console.log('Fixing StateGraphFacade Wave 5 embedded declarations...');

let content = fs.readFileSync(filePath, 'utf8');
const original = content;

// Fix 1: Line 151 - Embedded declaration after assignment
content = content.replace(
  /this\._currentNodeId\s*=\s*targetNodeId;const result:/g,
  'this._currentNodeId = targetNodeId;\n      const result:'
);

// Fix 2: Remove const keywords from object literal properties
content = content.replace(
  /const result: GraphTraversalResult\s*=\s*\{\s*const path,/g,
  'const result: GraphTraversalResult = {\n        path,'
);

content = content.replace(
  /const path,\s*const visitedNodes,/g,
  'path,\n        visitedNodes,'
);

content = content.replace(
  /const visitedNodes,\s*const totalDistance,/g,
  'visitedNodes,\n        totalDistance: _totalDistance,'
);

// Fix 3: Line 160 - Embedded declaration after catch
content = content.replace(
  /catch \(error\) \{const result:/g,
  'catch (error) {\n      const result:'
);

// Fix 4: Remove extra spaces in GraphTraversalResult assignment
content = content.replace(
  /const result: GraphTraversalResult\s{2,}=/g,
  'const result: GraphTraversalResult ='
);

if (content !== original) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('  ✓ Fixed StateGraphFacade.ts');
} else {
  console.log('  - No changes needed');
}

console.log('\nDone!');
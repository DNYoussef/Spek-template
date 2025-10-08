#!/usr/bin/env node
/**
 * Fix remaining embedded declarations in StateGraphFacade - Pass 2
 * Target lines 145-164, 329-357, 447-475
 */
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../src/architecture/langgraph/StateGraphFacade.ts');

console.log('Pass 2: Fixing remaining embedded declarations...');

let content = fs.readFileSync(FILE_PATH, 'utf8');
const original = content;

// Fix embedded declaration at line 151
content = content.replace(
  /this\._currentNodeId\s+=\s+targetNodeId;const result:\s*GraphTraversalResult\s+=\s+\{\s*const path,\s*const visitedNodes,\s*const totalDistance,/,
  'this._currentNodeId = targetNodeId;\n      const result: GraphTraversalResult = {\n        path: _path,\n        visitedNodes: visitedNodes,\n        totalDistance: _totalDistance,'
);

// Fix embedded declaration at line 160 (catch block) - already partially fixed but needs cleanup
content = content.replace(
  /\} catch \(error\) \{const result:\s*GraphTraversalResult\s+=\s+\{\s+path:/,
  '} catch (error) {\n      const result: GraphTraversalResult = {\n        path:'
);

// Fix line 329 - embedded declaration in function signature
content = content.replace(
  /private async findShortestPath\(sourceId: string, targetId: string\): Promise<string\[\]> \{\s+queue:\s*string\[\]\s+=\s+\[sourceId\];/,
  'private async findShortestPath(sourceId: string, targetId: string): Promise<string[]> {\n    const _queue: string[] = [sourceId];'
);

// Fix variable reference mismatches lines 334-348
content = content.replace(/visited\.add\(sourceId\);/g, '_visited.add(sourceId);');
content = content.replace(/while \(queue\.length > 0 && depth < maxDepth\)/g, 'while (_queue.length > 0 && _depth < _maxDepth)');
content = content.replace(/const _current\s+=\s+queue\.shift/g, 'const _current = _queue.shift');
content = content.replace(/if \(current === targetId\)/g, 'if (_current === targetId)');
content = content.replace(/return this\.reconstructPath\(parent, sourceId, targetId\);/g, 'return this.reconstructPath(_parent, sourceId, targetId);');
content = content.replace(/const _neighbors\s+=\s+this\._adjacencyList\.get\(current\)/g, 'const _neighbors = this._adjacencyList.get(_current)');
content = content.replace(/for \(const neighbor of neighbors\) \{/g, 'for (const neighbor of _neighbors) {');
content = content.replace(/if \(!visited\.has\(neighbor\)\) \{/g, 'if (!_visited.has(neighbor)) {');
content = content.replace(/visited\.add\(neighbor\);/g, '_visited.add(neighbor);');
content = content.replace(/parent\.set\(neighbor, current\);/g, '_parent.set(neighbor, _current);');
content = content.replace(/queue\.push\(neighbor\);/g, '_queue.push(neighbor);');
content = content.replace(/depth\+\+;/g, '_depth++;');

// Fix line 352 - embedded declaration
content = content.replace(
  /private reconstructPath\(parent: Map<string, string>, source: string, target: string\): string\[\] \{\s+path:\s*string\[\]\s+=\s+\[\];/,
  'private reconstructPath(parent: Map<string, string>, source: string, target: string): string[] {\n    const _path: string[] = [];'
);

// Fix variable references in reconstructPath (lines 353-359)
content = content.replace(/while \(current !== source\) \{/g, 'while (_current !== source) {');
content = content.replace(/path\.unshift\(current\);/g, '_path.unshift(_current);');
content = content.replace(/current\s+=\s+parent\.get\(current\)!/g, '_current = parent.get(_current)!');
content = content.replace(/path\.unshift\(source\);/g, '_path.unshift(source);');
content = content.replace(/return path;/g, 'return _path;');

// Fix line 447 - embedded declarations in findLongestPath
content = content.replace(
  /const _visited\s+=\s+new Set<string>\(\);\s+path:\s*string\[\]\s+=\s+\[\];/,
  'const _visited = new Set<string>();\n    const _path: string[] = [];'
);

// Fix line 448 - const keywords in function call
content = content.replace(
  /this\.dfsLongestPath\(startNode, const visited, const path, \[\]\);/,
  'this.dfsLongestPath(startNode, _visited, _path, []);'
);

// Fix return path reference
content = content.replace(/return path;\s*\n\s*\}\s*\n\s*private dfsLongestPath/g, 'return _path;\n  }\n  private dfsLongestPath');

// Fix line 461 - const keyword in function call
content = content.replace(
  /this\.dfsLongestPath\(neighbor, const visited, currentPath, longestPath\);/g,
  'this.dfsLongestPath(neighbor, visited, currentPath, longestPath);'
);

// Fix line 467 - embedded declaration
content = content.replace(
  /private findDeadlockStates\(\): string\[\] \{\s+deadlocks:\s*string\[\]\s+=\s+\[\];/,
  'private findDeadlockStates(): string[] {\n    const _deadlocks: string[] = [];'
);

// Fix variable references in findDeadlockStates (lines 468-475)
content = content.replace(/if \(neighbors\.length === 0\) \{/g, 'if (_neighbors.length === 0) {');
content = content.replace(/deadlocks\.push\(nodeId\);/g, '_deadlocks.push(nodeId);');
content = content.replace(/return deadlocks;\s*\n\s*\}\s*\n\s*private wouldCreateCycle/g, 'return _deadlocks;\n  }\n  private wouldCreateCycle');

// Fix more variable references that were missed
content = content.replace(/const _neighbors\s+=\s+this\._adjacencyList\.get\(node\) \|\| \[\];\s*for \(const neighbor of neighbors\) \{/g,
  'const _neighbors = this._adjacencyList.get(node) || [];\n    for (const neighbor of _neighbors) {');

if (content !== original) {
  fs.writeFileSync(FILE_PATH, content, 'utf8');
  console.log('✓ Pass 2 fixes applied successfully');

  // Count remaining patterns
  const issueLines = content.split('\n').filter((line, idx) => {
    return /const\s+\w+,/.test(line) ||
           /\)const\s+/.test(line) ||
           /\{const\s+/.test(line) ||
           /;\s*\w+:\s*\w+/.test(line);
  });

  if (issueLines.length > 0) {
    console.log(`  Warning: ${issueLines.length} potential patterns remaining`);
    issueLines.slice(0, 5).forEach((line, idx) => {
      console.log(`    Line ${idx + 1}: ${line.trim().substring(0, 80)}`);
    });
  } else {
    console.log('  All embedded declaration patterns fixed!');
  }
} else {
  console.log('  No changes made (patterns already fixed)');
}
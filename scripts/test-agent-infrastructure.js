/**
 * Agent Infrastructure Verification Test
 * Tests: AgentSpawner, ModelSelector, MCP Configuration
 */

const { agentSpawner } = require('../src/flow/core/agent-spawner');
const { modelSelector } = require('../src/flow/core/model-selector');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('AGENT INFRASTRUCTURE VERIFICATION TEST');
console.log('='.repeat(80));
console.log();

let testsPass = 0;
let testsFail = 0;

// Test 1: AgentSpawner Module Loading
console.log('[TEST 1] AgentSpawner Module Loading...');
try {
  if (typeof agentSpawner === 'object' && agentSpawner !== null) {
    console.log('  ✅ PASS: AgentSpawner loaded as object');
    console.log(`     - Type: ${typeof agentSpawner}`);
    console.log(`     - Constructor: ${agentSpawner.constructor.name}`);
    testsPass++;
  } else {
    console.log('  ❌ FAIL: AgentSpawner not loaded correctly');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}
console.log();

// Test 2: ModelSelector Module Loading
console.log('[TEST 2] ModelSelector Module Loading...');
try {
  if (typeof modelSelector === 'object' && modelSelector !== null) {
    console.log('  ✅ PASS: ModelSelector loaded as object');
    console.log(`     - Type: ${typeof modelSelector}`);
    testsPass++;
  } else {
    console.log('  ❌ FAIL: ModelSelector not loaded correctly');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}
console.log();

// Test 3: MCP Configuration File Exists
console.log('[TEST 3] MCP Configuration File...');
try {
  const mcpConfigPath = path.join(__dirname, '../src/flow/config/mcp-multi-platform.json');
  if (fs.existsSync(mcpConfigPath)) {
    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    const serverCount = Object.keys(mcpConfig.mcpServers || {}).length;
    console.log('  ✅ PASS: MCP configuration file exists');
    console.log(`     - Path: ${mcpConfigPath}`);
    console.log(`     - Servers configured: ${serverCount}`);
    testsPass++;
  } else {
    console.log('  ❌ FAIL: MCP configuration file not found');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}
console.log();

// Test 4: Agent Registry Files
console.log('[TEST 4] Agent Registry Files...');
try {
  const agentConfigPath = path.join(__dirname, '../src/flow/config/agent');
  const requiredFiles = [
    'AgentConfigLoader.js',
    'AgentRegistry.js',
    'CapabilityMapper.js',
    'MCPServerAssigner.js',
    'ModelSelector.js'
  ];

  let allFilesExist = true;
  requiredFiles.forEach(file => {
    const filePath = path.join(agentConfigPath, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ❌ Missing: ${file}`);
      allFilesExist = false;
    }
  });

  if (allFilesExist) {
    console.log('  ✅ PASS: All agent registry files exist');
    console.log(`     - Files verified: ${requiredFiles.length}`);
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Some agent registry files missing');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}
console.log();

// Test 5: AgentSpawner Methods
console.log('[TEST 5] AgentSpawner Methods...');
try {
  const requiredMethods = ['spawnAgent', 'analyzeTaskContext', 'generateAgentId'];
  let allMethodsExist = true;

  requiredMethods.forEach(method => {
    if (typeof agentSpawner[method] !== 'function') {
      console.log(`  ❌ Missing method: ${method}`);
      allMethodsExist = false;
    }
  });

  if (allMethodsExist) {
    console.log('  ✅ PASS: All required AgentSpawner methods exist');
    console.log(`     - Methods verified: ${requiredMethods.length}`);
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Some AgentSpawner methods missing');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}
console.log();

// Test 6: ModelSelector Methods
console.log('[TEST 6] ModelSelector Methods...');
try {
  const requiredMethods = ['selectModel', 'validateSelection'];
  let allMethodsExist = true;

  requiredMethods.forEach(method => {
    if (typeof modelSelector[method] !== 'function') {
      console.log(`  ❌ Missing method: ${method}`);
      allMethodsExist = false;
    }
  });

  if (allMethodsExist) {
    console.log('  ✅ PASS: All required ModelSelector methods exist');
    console.log(`     - Methods verified: ${requiredMethods.length}`);
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Some ModelSelector methods missing');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}
console.log();

// Test 7: Model Selection Logic
console.log('[TEST 7] Model Selection Logic...');
try {
  const testAgentTypes = [
    'frontend-developer',
    'researcher',
    'reviewer',
    'coder',
    'planner'
  ];

  let selectionWorks = true;
  testAgentTypes.forEach(agentType => {
    try {
      const result = modelSelector.selectModel(agentType, { description: 'test task' });
      if (!result || !result.model || !result.platform) {
        console.log(`  ❌ Selection failed for: ${agentType}`);
        selectionWorks = false;
      }
    } catch (err) {
      console.log(`  ❌ Error selecting ${agentType}: ${err.message}`);
      selectionWorks = false;
    }
  });

  if (selectionWorks) {
    console.log('  ✅ PASS: Model selection logic works');
    console.log(`     - Agent types tested: ${testAgentTypes.length}`);
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Model selection logic has issues');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}
console.log();

// Final Results
console.log('='.repeat(80));
console.log('TEST RESULTS SUMMARY');
console.log('='.repeat(80));
console.log(`✅ Tests Passed: ${testsPass}/7`);
console.log(`❌ Tests Failed: ${testsFail}/7`);
console.log(`📊 Success Rate: ${((testsPass / 7) * 100).toFixed(1)}%`);
console.log();

if (testsFail === 0) {
  console.log('🎉 ALL TESTS PASSED - Agent infrastructure is fully functional!');
  process.exit(0);
} else {
  console.log('⚠️  SOME TESTS FAILED - Agent infrastructure has issues that need fixing');
  process.exit(1);
}
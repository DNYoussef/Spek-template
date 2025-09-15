#!/usr/bin/env node
/**
 * Division 4 Simple Launcher
 */

const { spawn } = require('child_process');

console.log('🚀 Starting Division 4: Integrated Risk Dashboard');
console.log('🎯 Gary DPI + 🏺 Taleb Barbell + 🎲 Kelly Criterion + ⚠️ P(ruin) Monitor');

const child = spawn('npx', ['tsx', 'IntegratedServer.ts'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('❌ Failed to start Division 4:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Division 4 exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Division 4...');
  child.kill('SIGINT');
});

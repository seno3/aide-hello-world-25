#!/usr/bin/env node

/**
 * Final test script for TBA Extension
 * Verifies that everything is ready for VS Code testing
 */

const fs = require('fs');
const path = require('path');

console.log('🎓 TBA Extension - Final Test');
console.log('=============================\n');

// Test 1: Check compiled files
console.log('📦 Checking compiled files...');
const compiledFiles = [
  'out/extension.js',
  'out/core/ai.js',
  'out/core/risk.js',
  'out/core/boss.js',
  'out/core/codeExplainer.js',
  'out/storage/logger.js',
  'out/storage/export.js',
  'out/vscode/commands.js',
  'out/client/panel.js',
  'out/client/visualizer.js'
];

let allCompiled = true;
compiledFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allCompiled = false;
  }
});

// Test 2: Check package.json
console.log('\n📋 Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`  ✅ Extension name: ${packageJson.displayName}`);
  console.log(`  ✅ Version: ${packageJson.version}`);
  console.log(`  ✅ Main file: ${packageJson.main}`);
  
  const commands = packageJson.contributes?.commands || [];
  console.log(`  ✅ Commands registered: ${commands.length}`);
  commands.forEach(cmd => {
    console.log(`    - ${cmd.command}: ${cmd.title}`);
  });
} catch (error) {
  console.log(`  ❌ package.json error: ${error.message}`);
  allCompiled = false;
}

// Test 3: Check media assets
console.log('\n🎨 Checking media assets...');
const mediaFiles = [
  'media/d3.min.js',
  'media/boss-defeated.svg',
  'media/learning-icon.svg'
];

mediaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allCompiled = false;
  }
});

// Test 4: Check client files
console.log('\n🖥️  Checking client files...');
const clientFiles = [
  'src/client/panel.html',
  'src/client/styles.css'
];

clientFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allCompiled = false;
  }
});

// Test 5: Check dependencies
console.log('\n📚 Checking dependencies...');
if (fs.existsSync('node_modules')) {
  console.log('  ✅ node_modules directory exists');
  const packageLock = fs.existsSync('package-lock.json');
  console.log(`  ✅ package-lock.json: ${packageLock ? 'exists' : 'missing'}`);
} else {
  console.log('  ❌ node_modules directory missing');
  allCompiled = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allCompiled) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ TBA Extension is ready for VS Code testing!');
  console.log('\n📋 Next steps:');
  console.log('   1. Open this folder in VS Code');
  console.log('   2. Press F5 to launch Extension Development Host');
  console.log('   3. Open a JavaScript/TypeScript file');
  console.log('   4. Start coding to see learning cards!');
  console.log('\n🎯 Features to test:');
  console.log('   - Learning cards appear when you code');
  console.log('   - Quiz questions work correctly');
  console.log('   - Boss fights trigger every 5 changes');
  console.log('   - Export functionality works');
  console.log('   - Learning visualizer displays');
  console.log('\n🔧 Commands to try:');
  console.log('   - Ctrl+Shift+P → "TBA: Open Learning Panel"');
  console.log('   - Ctrl+Shift+P → "TBA: Export Today\'s Learnings"');
  console.log('   - Ctrl+Shift+P → "TBA: Toggle Boss Fight Mode"');
  console.log('   - Ctrl+Shift+P → "TBA: Explain Code"');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('🔧 Please fix the issues above before testing');
}
console.log('='.repeat(50));

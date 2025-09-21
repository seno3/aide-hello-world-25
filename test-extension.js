#!/usr/bin/env node

/**
 * Simple test script to verify TBA extension structure
 * Run with: node test-extension.js
 */

const fs = require('fs');
const path = require('path');

console.log('🎓 Testing Teach-Before-Apply Extension Structure...\n');

// Test files and directories
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  '.vscodeignore',
  'README.md',
  'src/extension.ts',
  'src/core/ai.ts',
  'src/core/risk.ts',
  'src/core/boss.ts',
  'src/core/telemetry.ts',
  'src/storage/logger.ts',
  'src/storage/export.ts',
  'src/vscode/commands.ts',
  'src/client/panel.html',
  'src/client/panel.ts',
  'src/client/visualizer.ts',
  'src/client/styles.css',
  'media/d3.min.js',
  'media/boss-defeated.svg',
  'media/learning-icon.svg'
];

const requiredDirs = [
  'src',
  'src/core',
  'src/storage',
  'src/vscode',
  'src/client',
  'media'
];

let allTestsPassed = true;

// Test directories
console.log('📁 Testing directories...');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`  ✅ ${dir}/`);
  } else {
    console.log(`  ❌ ${dir}/ - MISSING`);
    allTestsPassed = false;
  }
});

console.log('\n📄 Testing files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allTestsPassed = false;
  }
});

// Test package.json content
console.log('\n📦 Testing package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredCommands = ['tba.openPanel', 'tba.export', 'tba.toggleBoss'];
  const commands = packageJson.contributes?.commands || [];
  const commandIds = commands.map(cmd => cmd.command);
  
  requiredCommands.forEach(cmd => {
    if (commandIds.includes(cmd)) {
      console.log(`  ✅ Command: ${cmd}`);
    } else {
      console.log(`  ❌ Command: ${cmd} - MISSING`);
      allTestsPassed = false;
    }
  });
  
  console.log(`  ✅ Extension name: ${packageJson.displayName}`);
  console.log(`  ✅ Main file: ${packageJson.main}`);
  
} catch (error) {
  console.log(`  ❌ package.json parsing error: ${error.message}`);
  allTestsPassed = false;
}

// Test TypeScript configuration
console.log('\n⚙️  Testing TypeScript configuration...');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log(`  ✅ Target: ${tsconfig.compilerOptions.target}`);
  console.log(`  ✅ Output: ${tsconfig.compilerOptions.outDir}`);
  console.log(`  ✅ Source: ${tsconfig.compilerOptions.rootDir}`);
} catch (error) {
  console.log(`  ❌ tsconfig.json parsing error: ${error.message}`);
  allTestsPassed = false;
}

// Test core functionality files
console.log('\n🧠 Testing core functionality...');
const coreFiles = [
  'src/core/ai.ts',
  'src/core/risk.ts', 
  'src/core/boss.ts',
  'src/storage/logger.ts',
  'src/storage/export.ts'
];

coreFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.length > 100) {
      console.log(`  ✅ ${file} - Contains implementation`);
    } else {
      console.log(`  ⚠️  ${file} - File seems empty or minimal`);
    }
  } catch (error) {
    console.log(`  ❌ ${file} - Read error: ${error.message}`);
    allTestsPassed = false;
  }
});

// Test webview files
console.log('\n🖥️  Testing webview files...');
const webviewFiles = [
  'src/client/panel.html',
  'src/client/panel.ts',
  'src/client/visualizer.ts',
  'src/client/styles.css'
];

webviewFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.length > 50) {
      console.log(`  ✅ ${file} - Contains content`);
    } else {
      console.log(`  ⚠️  ${file} - File seems minimal`);
    }
  } catch (error) {
    console.log(`  ❌ ${file} - Read error: ${error.message}`);
    allTestsPassed = false;
  }
});

// Test media assets
console.log('\n🎨 Testing media assets...');
const mediaFiles = [
  'media/d3.min.js',
  'media/boss-defeated.svg',
  'media/learning-icon.svg'
];

mediaFiles.forEach(file => {
  try {
    const stats = fs.statSync(file);
    if (stats.size > 1000) {
      console.log(`  ✅ ${file} - Large file (${stats.size} bytes)`);
    } else {
      console.log(`  ✅ ${file} - Small file (${stats.size} bytes)`);
    }
  } catch (error) {
    console.log(`  ❌ ${file} - Missing or error: ${error.message}`);
    allTestsPassed = false;
  }
});

// Final result
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ TBA Extension is ready for development');
  console.log('\n📋 Next steps:');
  console.log('  1. Install Node.js and npm');
  console.log('  2. Run: npm install');
  console.log('  3. Run: npm run compile');
  console.log('  4. Press F5 in VS Code to test');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('🔧 Please fix the issues above before proceeding');
}
console.log('='.repeat(50));

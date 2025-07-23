#!/usr/bin/env node

/**
 * Test Runner for SynapseCore + AIVectorVault Integration
 * 
 * This script runs the integration tests and reports results.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Print banner
console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   SynapseCore + AIVectorVault Integration Test Runner     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

// Check if Jest is installed
const packageJsonPath = path.join(__dirname, '..', 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error(`${colors.red}Error reading package.json: ${error.message}${colors.reset}`);
  process.exit(1);
}

const hasJest = packageJson.devDependencies && packageJson.devDependencies.jest ||
                packageJson.dependencies && packageJson.dependencies.jest;

if (!hasJest) {
  console.log(`${colors.yellow}Jest is not installed. Installing Jest and required dependencies...${colors.reset}`);
  
  // Install Jest and testing libraries
  const npmInstall = spawn('npm', [
    'install', 
    '--save-dev', 
    'jest', 
    '@testing-library/react', 
    '@testing-library/jest-dom'
  ], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
  npmInstall.on('close', code => {
    if (code !== 0) {
      console.error(`${colors.red}Failed to install Jest. Please install it manually.${colors.reset}`);
      process.exit(1);
    }
    
    console.log(`${colors.green}Jest installed successfully.${colors.reset}`);
    runTests();
  });
} else {
  runTests();
}

function runTests() {
  console.log(`${colors.blue}Running integration tests...${colors.reset}`);
  
  // Run Jest with the integration test file
  const jest = spawn('npx', ['jest', 'integration.test.js'], {
    cwd: path.join(__dirname),
    stdio: 'inherit'
  });
  
  jest.on('close', code => {
    if (code === 0) {
      console.log(`${colors.green}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                 All tests passed! 🎉                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);
    } else {
      console.error(`${colors.red}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                 Tests failed! ❌                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);
    }
  });
}

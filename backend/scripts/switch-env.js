#!/usr/bin/env node

/**
 * Script to switch between development and production environments
 * Usage: node switch-env.js [dev|prod]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the target environment from command line arguments
const targetEnv = process.argv[2]?.toLowerCase();

if (!targetEnv || (targetEnv !== 'dev' && targetEnv !== 'prod')) {
  console.error('Please specify environment: dev or prod');
  console.log('Usage: node switch-env.js [dev|prod]');
  process.exit(1);
}

const isProduction = targetEnv === 'prod';
const envName = isProduction ? 'production' : 'development';

console.log(`Switching to ${envName} environment...`);

// Paths to env files
const backendEnvSource = path.join(__dirname, '..', isProduction ? '.env.production' : '.env.development');
const backendEnvTarget = path.join(__dirname, '..', '.env');

const frontendEnvSource = path.join(__dirname, '..', '..', 'frontend', isProduction ? '.env.production' : '.env.development');
const frontendEnvTarget = path.join(__dirname, '..', '..', 'frontend', '.env');

// Check if source files exist
if (!fs.existsSync(backendEnvSource)) {
  console.error(`Backend ${envName} environment file not found: ${backendEnvSource}`);
  console.log(`Please create ${backendEnvSource} based on the example file.`);
  process.exit(1);
}

if (!fs.existsSync(frontendEnvSource)) {
  console.error(`Frontend ${envName} environment file not found: ${frontendEnvSource}`);
  console.log(`Please create ${frontendEnvSource} based on the example file.`);
  process.exit(1);
}

// Copy environment files
try {
  fs.copyFileSync(backendEnvSource, backendEnvTarget);
  console.log(`✅ Backend environment set to ${envName}`);
  
  fs.copyFileSync(frontendEnvSource, frontendEnvTarget);
  console.log(`✅ Frontend environment set to ${envName}`);
  
  // Update package.json scripts if needed
  console.log('Environment switch complete!');
  console.log(`\nTo start the application in ${envName} mode:`);
  console.log('1. Backend: npm run dev');
  console.log('2. Frontend: npm run dev');
  
} catch (error) {
  console.error('Error switching environments:', error.message);
  process.exit(1);
}

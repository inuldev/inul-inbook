#!/usr/bin/env node

/**
 * Deployment helper script for Vercel
 * This script prepares the application for deployment to Vercel's hobby plan
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Helper function to run shell commands
function runCommand(command, cwd = process.cwd()) {
  try {
    log(`Running: ${command}`, colors.dim);
    return execSync(command, { cwd, stdio: 'inherit' });
  } catch (error) {
    log(`Command failed: ${command}`, colors.red);
    throw error;
  }
}

// Main function
async function main() {
  log('🚀 Preparing for Vercel deployment (Hobby Plan)', colors.bright + colors.cyan);
  
  // Check if we're in the root directory
  const frontendDir = path.join(process.cwd(), 'frontend');
  const backendDir = path.join(process.cwd(), 'backend');
  
  if (!fileExists(frontendDir) || !fileExists(backendDir)) {
    log('❌ Please run this script from the root directory of the project', colors.red);
    process.exit(1);
  }
  
  // Check for required environment files
  const frontendEnvProd = path.join(frontendDir, '.env.production');
  const backendEnvProd = path.join(backendDir, '.env.production');
  
  if (!fileExists(frontendEnvProd)) {
    log('⚠️ Frontend production environment file not found', colors.yellow);
    log('Creating from example file...', colors.yellow);
    
    if (fileExists(path.join(frontendDir, '.env.production.example'))) {
      fs.copyFileSync(
        path.join(frontendDir, '.env.production.example'),
        frontendEnvProd
      );
      log('✅ Created frontend/.env.production from example', colors.green);
    } else {
      log('❌ Frontend production environment example file not found', colors.red);
      log('Please create frontend/.env.production manually', colors.red);
    }
  }
  
  if (!fileExists(backendEnvProd)) {
    log('⚠️ Backend production environment file not found', colors.yellow);
    log('Creating from example file...', colors.yellow);
    
    if (fileExists(path.join(backendDir, '.env.production.example'))) {
      fs.copyFileSync(
        path.join(backendDir, '.env.production.example'),
        backendEnvProd
      );
      log('✅ Created backend/.env.production from example', colors.green);
    } else {
      log('❌ Backend production environment example file not found', colors.red);
      log('Please create backend/.env.production manually', colors.red);
    }
  }
  
  // Install dependencies
  log('\n📦 Installing dependencies...', colors.bright + colors.blue);
  
  try {
    log('\n🔧 Installing frontend dependencies...', colors.blue);
    runCommand('npm install', frontendDir);
    
    log('\n🔧 Installing backend dependencies...', colors.blue);
    runCommand('npm install', backendDir);
  } catch (error) {
    log('❌ Failed to install dependencies', colors.red);
    process.exit(1);
  }
  
  // Build the application
  log('\n🏗️ Building the application...', colors.bright + colors.magenta);
  
  try {
    log('\n🔨 Building frontend...', colors.magenta);
    runCommand('npm run build', frontendDir);
  } catch (error) {
    log('❌ Frontend build failed', colors.red);
    process.exit(1);
  }
  
  // Verify Vercel CLI is installed
  log('\n🔍 Checking for Vercel CLI...', colors.bright + colors.yellow);
  
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    log('✅ Vercel CLI is installed', colors.green);
  } catch (error) {
    log('⚠️ Vercel CLI not found. Installing...', colors.yellow);
    try {
      runCommand('npm install -g vercel');
      log('✅ Vercel CLI installed successfully', colors.green);
    } catch (error) {
      log('❌ Failed to install Vercel CLI', colors.red);
      log('Please install it manually: npm install -g vercel', colors.red);
    }
  }
  
  // Deployment instructions
  log('\n✅ Preparation complete!', colors.bright + colors.green);
  log('\n📝 Next steps for deployment:', colors.bright + colors.cyan);
  log('1. Login to Vercel: vercel login', colors.cyan);
  log('2. Deploy frontend: cd frontend && vercel', colors.cyan);
  log('3. Deploy backend: cd backend && vercel', colors.cyan);
  log('4. Update environment variables in Vercel dashboard', colors.cyan);
  log('5. Redeploy both projects if needed', colors.cyan);
  
  log('\n🎉 Good luck with your deployment!', colors.bright + colors.green);
}

// Run the main function
main().catch((error) => {
  log(`\n❌ An error occurred: ${error.message}`, colors.red);
  process.exit(1);
});

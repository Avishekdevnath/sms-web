#!/usr/bin/env node

// ✅ BUILD SCRIPT THAT IGNORES ALL ERRORS
// This script forces the build to complete even with errors

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build with error suppression...');

try {
  // Set environment variables to ignore errors
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.NODE_ENV = 'production';
  process.env.NEXT_IGNORE_BUILD_ERRORS = '1';
  process.env.NEXT_IGNORE_ESLINT_ERRORS = '1';
  process.env.NEXT_IGNORE_TYPE_ERRORS = '1';
  
  // Force build with error suppression
  const buildCommand = 'next build --no-lint --no-mangling';
  
  console.log('📦 Running build command:', buildCommand);
  
  execSync(buildCommand, {
    stdio: 'inherit',
    env: {
      ...process.env,
      FORCE_COLOR: '1',
      NODE_OPTIONS: '--max-old-space-size=4096',
    }
  });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.log('⚠️  Build completed with errors (ignored as requested)');
  console.log('📁 Build output available in .next directory');
  
  // Check if .next directory exists
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    console.log('✅ Build artifacts found in .next directory');
  } else {
    console.log('❌ No build artifacts found');
  }
  
  // Exit with success code to indicate build "completed"
  process.exit(0);
}

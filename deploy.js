// Firebase deployment script
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
console.log(`${colors.bright}${colors.blue}  YBT Online Hub - Firebase Deployment  ${colors.reset}`);
console.log(`${colors.bright}${colors.blue}========================================${colors.reset}\n`);

// Step 1: Build the app
try {
  console.log(`${colors.yellow}Step 1: Building the application...${colors.reset}`);
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Build completed successfully!${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}✗ Build failed: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 2: Check if Firebase configuration exists
if (!fs.existsSync(path.join(__dirname, 'firebase.json'))) {
  console.error(`${colors.red}✗ Firebase configuration not found. Please run 'firebase init' first.${colors.reset}`);
  process.exit(1);
}

// Step 3: Deploy to Firebase
try {
  console.log(`${colors.yellow}Step 2: Deploying to Firebase...${colors.reset}`);
  execSync('npx firebase deploy', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Deployment completed successfully!${colors.reset}\n`);

  // Get the project ID from .firebaserc if it exists
  let deployUrl = 'Firebase Hosting';
  try {
    if (fs.existsSync(path.join(__dirname, '.firebaserc'))) {
      const firebaserc = JSON.parse(fs.readFileSync(path.join(__dirname, '.firebaserc'), 'utf8'));
      const projectId = firebaserc.projects.default;
      deployUrl = `https://${projectId}.web.app`;
    }
  } catch (error) {
    console.warn(`${colors.yellow}Could not determine deployment URL: ${error.message}${colors.reset}`);
  }

  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.green}  Application deployed successfully!  ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}Your application is now live at: ${colors.blue}${deployUrl}${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}✗ Deployment failed: ${error.message}${colors.reset}`);
  process.exit(1);
}

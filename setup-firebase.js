// Firebase Setup Script
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

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

// Function to prompt for user input
const promptUser = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

console.log(`${colors.bright}${colors.blue}============================================${colors.reset}`);
console.log(`${colors.bright}${colors.blue}  YBT Online Hub - Firebase Initialization  ${colors.reset}`);
console.log(`${colors.bright}${colors.blue}============================================${colors.reset}\n`);

// Main function
async function setupFirebase() {
  try {
    // Check if Firebase CLI is installed
    console.log(`${colors.yellow}Step 1: Checking for Firebase CLI...${colors.reset}`);
    try {
      execSync('npx firebase --version', { stdio: 'ignore' });
      console.log(`${colors.green}✓ Firebase CLI is available!${colors.reset}\n`);
    } catch (error) {
      console.log(`${colors.yellow}Installing Firebase CLI...${colors.reset}`);
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      console.log(`${colors.green}✓ Firebase CLI installed successfully!${colors.reset}\n`);
    }

    // Check if user is logged in
    console.log(`${colors.yellow}Step 2: Checking Firebase login status...${colors.reset}`);
    try {
      execSync('npx firebase projects:list', { stdio: 'ignore' });
      console.log(`${colors.green}✓ Already logged in to Firebase!${colors.reset}\n`);
    } catch (error) {
      console.log(`${colors.yellow}Please log in to Firebase:${colors.reset}`);
      execSync('npx firebase login', { stdio: 'inherit' });
      console.log(`${colors.green}✓ Login successful!${colors.reset}\n`);
    }

    // Create firebase.json if it doesn't exist
    console.log(`${colors.yellow}Step 3: Creating Firebase configuration files...${colors.reset}`);
    
    if (!fs.existsSync(path.join(__dirname, 'firebase.json'))) {
      // Default hosting config
      const firebaseJson = {
        "hosting": {
          "public": "dist",
          "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
          ],
          "rewrites": [
            {
              "source": "**",
              "destination": "/index.html"
            }
          ]
        }
      };
      
      fs.writeFileSync(
        path.join(__dirname, 'firebase.json'),
        JSON.stringify(firebaseJson, null, 2)
      );
      console.log(`${colors.green}✓ Created firebase.json${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ firebase.json already exists${colors.reset}`);
    }

    // Create .firebaserc if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, '.firebaserc'))) {
      const projectId = await promptUser(`${colors.yellow}Enter your Firebase project ID (e.g., ctjsr-c8be4): ${colors.reset}`);
      
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      const firebaserc = {
        "projects": {
          "default": projectId
        }
      };
      
      fs.writeFileSync(
        path.join(__dirname, '.firebaserc'),
        JSON.stringify(firebaserc, null, 2)
      );
      console.log(`${colors.green}✓ Created .firebaserc with project ID: ${projectId}${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ .firebaserc already exists${colors.reset}`);
    }

    // Create Firestore rules if they don't exist
    if (!fs.existsSync(path.join(__dirname, 'firestore.rules'))) {
      const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow users to read public blog posts, admins to write
    match /blogs/{blogId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read products, admins to write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Basic rules for other collections
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}`;
      
      fs.writeFileSync(path.join(__dirname, 'firestore.rules'), firestoreRules);
      console.log(`${colors.green}✓ Created firestore.rules${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ firestore.rules already exists${colors.reset}`);
    }

    // Create Storage rules if they don't exist
    if (!fs.existsSync(path.join(__dirname, 'storage.rules'))) {
      const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read/write their own user images
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read blog images, admins to write
    match /blogs/{blogId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Basic rules for other files
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}`;
      
      fs.writeFileSync(path.join(__dirname, 'storage.rules'), storageRules);
      console.log(`${colors.green}✓ Created storage.rules${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ storage.rules already exists${colors.reset}`);
    }

    console.log(`\n${colors.green}✓ Firebase configuration completed successfully!${colors.reset}\n`);
    
    console.log(`${colors.bright}${colors.blue}============================================${colors.reset}`);
    console.log(`${colors.bright}${colors.green}  Firebase setup completed!  ${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}============================================${colors.reset}`);
    console.log(`${colors.bright}Next steps:${colors.reset}`);
    console.log(`1. Run ${colors.yellow}npm run build${colors.reset} to build your application`);
    console.log(`2. Run ${colors.yellow}npx firebase deploy${colors.reset} to deploy your application`);
    console.log(`   Or use the ${colors.yellow}node deploy.js${colors.reset} script\n`);
    
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the setup function
setupFirebase();

#!/bin/bash

# Script to push code to GitHub repository
# Uses environment variable GITHUB_TOKEN for authentication

echo "🚀 Pushing Copperx Telegram Bot to GitHub..."

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Error: GITHUB_TOKEN environment variable is not set."
  echo "Please set the GITHUB_TOKEN environment variable."
  exit 1
fi

# Repository information
REPO_OWNER="RishikeshJ21"
REPO_NAME="copperx_bot"
BRANCH="main"

# Setup git configuration
git config --global user.name "Copperx Bot"
git config --global user.email "bot@copperx.io"

# Initialize git if not already done
if [ ! -d ".git" ]; then
  echo "📦 Initializing git repository..."
  git init
  git remote add origin "https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
else
  # Update remote URL with token
  echo "🔄 Updating remote URL with token..."
  git remote set-url origin "https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
  # Debug: Check remote (hide token)
  git remote -v | sed 's/https:\/\/[^@]*@/https:\/\/****@/g'
fi

# Create .gitignore file if it doesn't exist
if [ ! -f ".gitignore" ]; then
  echo "📝 Creating .gitignore file..."
  cat > .gitignore << END_GITIGNORE
# Node.js
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Cache and build files
.cache/
dist/
build/
*.tsbuildinfo

# Logs
logs/
*.log

# Editor directories and files
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db
END_GITIGNORE
fi

# Add all files to git
echo "📂 Adding files to git..."
git add .

# Commit changes
COMMIT_MESSAGE="Update Copperx Telegram Bot - $(date '+%Y-%m-%d %H:%M:%S')"
echo "💾 Committing changes: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
echo "☁️ Pushing to GitHub..."
git push -u origin $BRANCH

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed to GitHub!"
  echo "🔗 Repository URL: https://github.com/$REPO_OWNER/$REPO_NAME"
else
  echo "❌ Failed to push to GitHub."
  echo "Debug information:"
  echo "- Make sure the GITHUB_TOKEN has the correct permissions"
  echo "- Check if the repository exists and you have access"
fi

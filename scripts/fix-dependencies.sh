#!/bin/bash

# Fix for dependency conflicts caused by npm audit fix
# This script clean reinstalls dependencies with correct versions

set -e # Exit on error

echo "🧹 Cleaning up existing dependencies..."
rm -rf node_modules package-lock.json

echo "📦 Installing critical dependencies explicitly..."
# Install TypeScript and Jest testing stack
npm install typescript@4.9 ts-jest @types/jest jest @types/node --save-dev

# Install latest react-scripts to fix 0.0.0 version issue
npm install react-scripts@latest --save

echo "📥 Installing remaining project dependencies..."
npm install

echo "⚙️  Creating Jest configuration..."
cat > jest.config.js <<'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
};
EOF

echo "✅ Verifying react-scripts version..."
npm list react-scripts

echo "🧪 Running tests to verify fix..."
npx jest

echo "✨ Dependency fix complete!"
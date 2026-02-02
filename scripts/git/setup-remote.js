#!/usr/bin/env node

/**
 * 🚀 Git Remote Setup Wizard
 * Automates connecting the local project to a GitHub repository.
 * 
 * Features:
 * - Extracts GITHUB_TOKEN from ~/.zshrc
 * - Lists existing repositories
 * - Creates new repositories via API
 * - Updates package.json and git config
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const GITHUB_API = 'https://api.github.com';
const ROOT_DIR = path.resolve(__dirname, '../../');

// UI Helpers
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  dim: "\x1b[2m"
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log(`\n${colors.cyan}🔗 Git Remote Setup Wizard${colors.reset}\n`);

  // 1. Check Existing Remote
  try {
    const currentRemote = execSync('git remote get-url origin', { stdio: 'pipe', cwd: ROOT_DIR }).toString().trim();
    console.log(`Current remote: ${colors.green}${currentRemote}${colors.reset}`);
    
    const reconfigure = await question(`Do you want to reconfigure? (y/N) `);
    if (reconfigure.toLowerCase() !== 'y') {
      console.log('✅ Keeping existing configuration.');
      rl.close();
      return;
    }
  } catch (e) {
    console.log(`${colors.yellow}No remote 'origin' configured.${colors.reset}`);
  }

  // 2. Get Credentials
  let token = process.env.GITHUB_TOKEN;
  if (!token) {
    const zshrcPath = path.join(os.homedir(), '.zshrc');
    if (fs.existsSync(zshrcPath)) {
      const content = fs.readFileSync(zshrcPath, 'utf8');
      const match = content.match(/(?:export\s+)?GITHUB_TOKEN=['"]?([^'"\s]+)['"]?/);
      if (match) {
        token = match[1];
        console.log(`${colors.dim}Found GITHUB_TOKEN in ~/.zshrc${colors.reset}`);
      }
    }
  }

  if (!token) {
    console.log(`\n${colors.yellow}GITHUB_TOKEN not found.${colors.reset}`);
    console.log(`Please enter a GitHub Personal Access Token (repo scope).`);
    token = await question(`Token: `);
  }

  if (!token) {
    console.error(`${colors.red}❌ Token required to proceed.${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  // 3. Fetch Repositories
  console.log(`\n${colors.dim}Fetching your repositories...${colors.reset}`);
  const repos = await fetchRepos(token);
  
  // 4. Display Menu
  console.log(`\nSelect a repository or create a new one:`);
  repos.forEach((repo, index) => {
    console.log(`${index + 1}. ${repo.full_name} ${repo.private ? '(🔒 Private)' : ''}`);
  });
  console.log(`${colors.green}${repos.length + 1}. ✨ Create New Repository${colors.reset}`);

  const selection = await question(`\nChoice (1-${repos.length + 1}): `);
  const index = parseInt(selection) - 1;

  let remoteUrl = '';

  if (index === repos.length) {
    // Create New
    remoteUrl = await createRepoWizard(token);
  } else if (repos[index]) {
    // Use Existing
    remoteUrl = repos[index].ssh_url || repos[index].clone_url;
  } else {
    console.error(`${colors.red}Invalid selection.${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  // 5. Configure Remote
  console.log(`\nConfiguring remote: ${colors.cyan}${remoteUrl}${colors.reset}`);
  try {
    try {
      execSync('git remote remove origin', { stdio: 'ignore', cwd: ROOT_DIR });
    } catch (e) {}
    
    execSync(`git remote add origin ${remoteUrl}`, { cwd: ROOT_DIR });
    console.log(`✅ Remote 'origin' set successfully.`);
    
    // Update package.json
    updatePackageJson(remoteUrl);

    const pushNow = await question(`Push local code to remote now? (y/N) `);
    if (pushNow.toLowerCase() === 'y') {
      console.log(`${colors.dim}Pushing to main...${colors.reset}`);
      execSync('git branch -M main', { cwd: ROOT_DIR });
      execSync('git push -u origin main', { cwd: ROOT_DIR });
      console.log(`✅ Pushed successfully.`);
    }
  } catch (error) {
    console.error(`${colors.red}Error configuring remote:${colors.reset}`, error.message);
  }

  rl.close();
}

async function fetchRepos(token) {
  try {
    const res = await fetch(`${GITHUB_API}/user/repos?sort=updated&direction=desc&per_page=15`, {
      headers: { 'Authorization': `token ${token}`, 'User-Agent': 'OpenRouter-Crew-Platform' }
    });
    if (!res.ok) throw new Error(`GitHub API Error: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error(`${colors.red}Failed to fetch repos:${colors.reset}`, error.message);
    return [];
  }
}

async function createRepoWizard(token) {
  console.log(`\n${colors.cyan}✨ Create New Repository${colors.reset}`);
  const name = await question(`Repository Name: `);
  const isPrivate = (await question(`Private? (Y/n): `)).toLowerCase() !== 'n';
  const description = "Unified cost-optimized AI orchestration platform";

  try {
    const res = await fetch(`${GITHUB_API}/user/repos`, {
      method: 'POST',
      headers: { 
        'Authorization': `token ${token}`, 
        'User-Agent': 'OpenRouter-Crew-Platform',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, private: isPrivate, description })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || res.statusText);
    }
    
    const repo = await res.json();
    console.log(`✅ Repository created: ${repo.html_url}`);
    return repo.ssh_url || repo.clone_url;
  } catch (error) {
    console.error(`${colors.red}Failed to create repo:${colors.reset}`, error.message);
    process.exit(1);
  }
}

function updatePackageJson(url) {
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  pkg.repository = { type: 'git', url: url };
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ Updated package.json repository URL.`);
}

main();
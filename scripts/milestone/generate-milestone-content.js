#!/usr/bin/env node

/**
 * 🤖 Crew-Powered Milestone Documentation Generator
 * 
 * Connects to the n8n crew system to generate insightful milestone documentation
 * based on the feature name and current git status.
 * 
 * Crew Member: Commander Data (Operations)
 * Goal: Analyze context and generate structured documentation
 * Optimization: Uses OpenRouter cost-effective routing via n8n
 */

const featureName = process.env.FEATURE_NAME;
const branchName = process.env.BRANCH_NAME;
const changesStatus = process.env.CHANGES_STATUS || '';
const changesStat = process.env.CHANGES_STAT || '';
const timestamp = new Date().toISOString();

// Default template if Crew is unavailable (Fallback)
const defaultTemplate = `# Milestone: ${featureName}

**Created:** ${new Date().toLocaleString()}
**Branch:** ${branchName}
**Status:** In Progress

## Description

Milestone created for feature: **${featureName}**

### Initial Context
The following changes were present at milestone creation:

\`\`\`text
${changesStatus}
${changesStat}
\`\`\`

## Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes

[Add any relevant notes or context]
`;

async function generateContent() {
  // Default to production n8n instance for milestone creation
  const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.pbradygeorgen.com/webhook/crew-commander_data';
  console.error(`\x1b[36m📡 Connecting to n8n Crew at: ${n8nUrl}\x1b[0m`);

  try {
    // 5 second timeout to ensure CLI responsiveness
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'OpenRouter-Crew-CLI'
      },
      body: JSON.stringify({
        action: 'generate_milestone_docs',
        context: {
          feature: featureName,
          branch: branchName,
          changes: {
            status: changesStatus,
            stat: changesStat
          },
          timestamp
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.error(`\x1b[32m✅ Connection successful (Status: ${response.status})\x1b[0m`);

      // Check for content in various likely response fields
      const content = data.content || data.output || data.text || data.markdown;
      
      if (content) {
        // Log success to stderr so it doesn't pollute the stdout pipe
        console.error('\x1b[32m%s\x1b[0m', '✅ Commander Data generated documentation.');
        // Log the raw response for verification as requested
        console.error('\x1b[2m%s\x1b[0m', '📄 Response preview: ' + JSON.stringify(data).substring(0, 100) + '...');
        return content;
      } else {
        console.error('\x1b[33m⚠️  Webhook returned data but no content field found. Response:\x1b[0m', JSON.stringify(data));
      }
    } else {
      console.error(`\x1b[31m❌ Webhook returned error status: ${response.status} ${response.statusText}\x1b[0m`);
    }
  } catch (error) {
    console.error(`\x1b[31m❌ Connection failed: ${error.message}\x1b[0m`);
  }

  console.error('\x1b[33m⚠️  Falling back to default template.\x1b[0m');
  return defaultTemplate;
}

generateContent().then(console.log);
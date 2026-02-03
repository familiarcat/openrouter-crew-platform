#!/usr/bin/env node

/**
 * 🤖 Agile Feature Documentation Generator
 */

const featureName = process.env.FEATURE_NAME;
const branchName = process.env.BRANCH_NAME;
const project = process.env.PROJECT_CONTEXT;
const sprint = process.env.SPRINT_CONTEXT;
const story = process.env.STORY_CONTEXT;
const timestamp = new Date().toISOString();

// Default template if Crew is unavailable
const defaultTemplate = `# Feature: ${featureName}

**Project:** ${project}
**Sprint:** ${sprint}
**Story:** ${story}
**Branch:** ${branchName}
**Created:** ${new Date().toLocaleString()}

## 🎯 Goal

[Describe the specific goal of this feature implementation.]

## 🛠️ Technical Plan

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## 📝 Notes

[Add technical notes here]
`;

async function generateContent() {
  const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.pbradygeorgen.com/webhook/crew-geordi_la_forge';

  console.error(`\x1b[36m📡 Consulting Geordi La Forge for technical specs...\x1b[0m`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'OpenRouter-Crew-CLI' },
      body: JSON.stringify({
        action: 'generate_feature_plan',
        context: { featureName, project, sprint, story, branchName, timestamp }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const content = data.content || data.output || data.text || data.markdown;
      if (content) {
        console.error('\x1b[32m%s\x1b[0m', '✅ Technical plan generated.');
        return content;
      }
    }
  } catch (error) { /* Fallback silently */ }

  console.error('\x1b[33m⚠️  Using default template.\x1b[0m');
  return defaultTemplate;
}

generateContent().then(console.log).catch(() => console.log(defaultTemplate));
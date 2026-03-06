#!/usr/bin/env node

const { exec } = require('child_process');

// --- Helper Functions ---
const log = (message) => console.log(`[Weekly Report] ${message}`);
const logError = (message) => console.error(`[Weekly Report] ERROR: ${message}`);

// --- Main Logic ---
async function generateAndSendReport() {
  const args = process.argv.slice(2);
  const emailIndex = args.indexOf('--email-to');
  let emailTo = null;

  if (emailIndex !== -1 && args[emailIndex + 1]) {
    emailTo = args[emailIndex + 1];
  }

  if (!emailTo) {
    logError('Missing --email-to argument. Usage: node scripts/generate-weekly-report.js --email-to "user@example.com"');
    process.exit(1);
  }

  log(`Generating weekly cost report for ${emailTo}...`);

  // Use the 'crew' CLI to get the report data. Ensure it's built first.
  exec('pnpm --filter @openrouter-crew/cli build && crew cost report --period 7 --json', (error, stdout, stderr) => {
    if (error) {
      logError(`Failed to generate report: ${error.message}`);
      if (stderr) {
        logError(`stderr: ${stderr}`);
      }
      process.exit(1);
    }

    try {
      // The output might contain build logs before the JSON. Find the start of the JSON.
      const jsonStartIndex = stdout.indexOf('{');
      if (jsonStartIndex === -1) {
        throw new Error('No JSON output found from crew CLI command.');
      }
      const jsonOutput = stdout.substring(jsonStartIndex);
      
      const reportData = JSON.parse(jsonOutput);
      log('Successfully generated report data.');

      // Simulate sending an email
      log(`Simulating email dispatch to: ${emailTo}`);
      console.log('--- Email Content ---');
      console.log(`Subject: Weekly Cost Report`);
      console.log(`To: ${emailTo}`);
      console.log('\nBody:\n');
      console.log(JSON.stringify(reportData, null, 2));
      console.log('---------------------');
      log('✅ Report simulation complete.');

    } catch (parseError) {
      logError(`Failed to parse report JSON: ${parseError.message}`);
      logError(`Raw output from CLI: ${stdout}`);
      process.exit(1);
    }
  });
}

generateAndSendReport();

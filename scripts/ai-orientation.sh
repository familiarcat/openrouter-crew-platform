#!/usr/bin/env bash
# AI Orientation Script - Provides a high-fidelity map of the monorepo for LLM context

OUTPUT_FILE=".ai-context.md"

echo "# 🧠 AI Orientation Map: OpenRouter Crew Platform" > $OUTPUT_FILE
echo "Generated: $(date)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "## 🏗️ Architecture Status: Domain-Driven Design (5 Domains)" >> $OUTPUT_FILE
echo "1. **shared**: Bedrock (Cost tracking, schemas, API clients)" >> $OUTPUT_FILE
echo "2. **alex-ai-universal**: Intelligence Layer (Agent coordination)" >> $OUTPUT_FILE
echo "3. **product-factory**: Business Generation Engine" >> $OUTPUT_FILE
echo "4. **vscode-extension**: Primary User Interface" >> $OUTPUT_FILE
echo "5. **test-projects**: Validation (BarItalia STL)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "## 📦 Monorepo Package Map" >> $OUTPUT_FILE
echo "\`\`\`" >> $OUTPUT_FILE
pnpm ls -r --depth 0 >> $OUTPUT_FILE
echo "\`\`\`" >> $OUTPUT_FILE

echo "## 🚀 Command Registry" >> $OUTPUT_FILE
echo "Use these commands to manage the platform:" >> $OUTPUT_FILE
jq -r '.scripts | to_entries[] | "* **pnpm \(.key)**: \(.value)"' package.json >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "## 🛠️ Maintenance Status" >> $OUTPUT_FILE
if [ -f "apps/codebase-analyzer/codebase-metrics.txt" ]; then
    cat apps/codebase-analyzer/codebase-metrics.txt | head -n 20 >> $OUTPUT_FILE
else
    echo "Codebase metrics not found. Run 'pnpm orient' to generate." >> $OUTPUT_FILE
fi

chmod +x scripts/ai-orientation.sh

echo "✅ AI Orientation context updated in $OUTPUT_FILE"
echo "Refer to this file in prompts to maintain architectural alignment."
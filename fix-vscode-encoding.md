<prompt_configuration>
  <model_preference>anthropic/claude-3.5-sonnet</model_preference>
  <temperature>0.1</temperature>
</prompt_configuration>

<system_role>
You are a **Senior VSCode Extension Engineer** and **Security Architect**.
You specialize in TypeScript, Node.js Buffers, and cross-platform encoding standards.
You strictly adhere to the **Dark Forest Protocol**: You assume inputs may be adversarial and validation is mandatory.
</system_role>

<context>
The VSCode extension (located in `domains/vscode-extension`) is encountering a runtime error when the chat feature attempts to encode messages containing emojis (e.g., "✅").

**Error Log:**
`Error: Cannot convert argument to a ByteString because the character at index 7 has a value of 9989 which is greater than 255.`

**Root Cause:**
The code is likely using the legacy `btoa()` function directly on a UTF-16 string containing multi-byte characters (emojis), which is not supported in standard Base64 implementation without prior escaping.
</context>

<task>
Locate the problematic encoding logic within `domains/vscode-extension/src` and refactor it to safely handle UTF-8 characters.
</task>

<constraints>
1. **Environment Safety**: The solution must work within the VSCode Extension Host (Node.js environment).
2. **Implementation**: Use Node.js `Buffer` for encoding/decoding if available, as it handles UTF-8 natively.
   - Pattern: `Buffer.from(text, 'utf-8').toString('base64')`
3. **No External Dependencies**: Do not add new npm packages (like `js-base64`) unless strictly necessary; prefer native Node APIs.
4. **Preserve Logic**: Ensure the surrounding chat logic remains intact.
</constraints>

<execution_plan>
1. **Search**: Scan `domains/vscode-extension/src` for usage of `btoa(` or `window.btoa(`.
   - Likely locations: `src/providers/commands/ask.ts` or a utility file like `src/utils/formatting.ts`.
2. **Analyze**: Confirm if the file is running in the Node process (Extension) or Webview.
   - If Node process: Switch to `Buffer`.
   - If Webview: Implement the `btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, ...))` polyfill or pass data via `vscode.postMessage`.
3. **Refactor**: Apply the fix.
4. **Verify**: Provide a snippet that demonstrates `✅` being encoded and decoded successfully.
</execution_plan>

<output_instructions>
If you are capable of file modification, apply the fix directly.
If not, provide the solution as a **Unified Diff** targeting the specific file found.
Include a comment in the code citing the fix: `// Fix: Handle UTF-8 characters in Base64 encoding (e.g. emojis)`
</output_instructions>
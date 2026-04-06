export class DataAgentServer {}; export class WorfAgentServer {}; export class CrewOrchestrator {};
// ─── Stub exports required by vscode-extension ──────────────────────────────
export class PromptManager {
  getPrompt(_name: string): string { return ''; }
  listPrompts(): string[] { return []; }
}
export class OllamaMCPClient {
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  async query(_prompt: string): Promise<string> { return ''; }
}

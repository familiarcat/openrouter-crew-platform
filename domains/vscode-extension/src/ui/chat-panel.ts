/**
 * Chat Panel UI
 *
 * Webview-based chat interface for AI interactions.
 * Handles messages, cost display, and result rendering.
 */

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    intent?: string;
    language?: string;
    cost?: number;
    executionTimeMs?: number;
    model?: string;
  };
}

/**
 * Chat panel state
 */
export interface ChatPanelState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentBudget: number;
  budgetRemaining: number;
  totalCost: number;
}

/**
 * Chat Panel Controller
 */
export class ChatPanel {
  private messages: ChatMessage[] = [];
  private isLoading: boolean = false;
  private currentBudget: number = 100;
  private budgetRemaining: number = 100;
  private totalCost: number = 0;
  private messageId: number = 0;

  /**
   * Add message to chat
   */
  addMessage(role: 'user' | 'assistant', content: string, metadata?: any): ChatMessage {
    const message: ChatMessage = {
      id: `msg-${++this.messageId}`,
      role,
      content,
      timestamp: Date.now(),
      metadata,
    };

    this.messages.push(message);

    // Update cost tracking
    if (metadata?.cost) {
      this.totalCost += metadata.cost;
      this.budgetRemaining -= metadata.cost;
    }

    return message;
  }

  /**
   * Get chat history
   */
  getHistory(limit: number = 50): ChatMessage[] {
    return this.messages.slice(-limit);
  }

  /**
   * Clear chat
   */
  clearChat(): void {
    this.messages = [];
  }

  /**
   * Generate HTML for chat panel
   */
  generateHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex AI Chat</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .header {
      padding: 16px;
      border-bottom: 1px solid var(--vscode-list-hoverBackground);
      background: var(--vscode-sideBar-background);
    }

    .title {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .cost-meter {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }

    .cost-bar {
      flex: 1;
      height: 4px;
      background: var(--vscode-list-hoverBackground);
      border-radius: 2px;
      overflow: hidden;
    }

    .cost-fill {
      height: 100%;
      background: linear-gradient(90deg, #4ec9b0, #ce9178, #d7ba7d);
      transition: width 0.3s ease;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message {
      display: flex;
      gap: 8px;
    }

    .message.user {
      justify-content: flex-end;
    }

    .message-content {
      max-width: 80%;
      padding: 10px 12px;
      border-radius: 6px;
      line-height: 1.5;
    }

    .message.user .message-content {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .message.assistant .message-content {
      background: var(--vscode-list-hoverBackground);
      color: var(--vscode-editor-foreground);
    }

    .message-metadata {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }

    .input-area {
      padding: 12px 16px;
      border-top: 1px solid var(--vscode-list-hoverBackground);
      background: var(--vscode-sideBar-background);
      display: flex;
      gap: 8px;
    }

    .input-field {
      flex: 1;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 8px 12px;
      font-family: inherit;
      font-size: 14px;
    }

    .input-field:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }

    .send-button {
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .send-button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .code-block {
      background: var(--vscode-terminal-background);
      border: 1px solid var(--vscode-list-hoverBackground);
      border-radius: 4px;
      padding: 12px;
      overflow-x: auto;
      margin: 8px 0;
    }

    .code-block code {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 12px;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--vscode-descriptionForeground);
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid var(--vscode-descriptionForeground);
      border-top: 2px solid var(--vscode-button-background);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🤖 Alex AI Assistant</div>
    <div class="cost-meter">
      <span id="budget-text">Budget: $0.00</span>
      <div class="cost-bar">
        <div class="cost-fill" id="cost-fill" style="width: 0%"></div>
      </div>
      <span id="cost-text">0%</span>
    </div>
  </div>

  <div class="messages" id="messages">
    <div class="message assistant">
      <div class="message-content">
        <p>Hi! I'm Alex, your AI coding companion. I can help you:</p>
        <ul style="margin: 8px 0 0 20px;">
          <li>Review and analyze code</li>
          <li>Generate new code</li>
          <li>Explain complex concepts</li>
          <li>Debug errors</li>
          <li>Refactor for improvements</li>
          <li>Generate tests</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="input-area">
    <input
      type="text"
      class="input-field"
      id="input"
      placeholder="Ask me anything about code..."
      autocomplete="off"
    />
    <button class="send-button" id="send">Send</button>
  </div>

  <script>
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send');
    const messagesDiv = document.getElementById('messages');
    const costFill = document.getElementById('cost-fill');
    const costText = document.getElementById('cost-text');
    const budgetText = document.getElementById('budget-text');

    // Send message on click or Enter
    function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      addMessage('user', text);
      input.value = '';

      // Signal to VSCode extension
      acquireVsCodeApi().postMessage({
        command: 'executeCommand',
        text: text,
      });

      // Show loading
      showLoading();
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        sendMessage();
      }
    });

    function addMessage(role, content) {
      const message = document.createElement('div');
      message.className = 'message ' + role;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.innerHTML = formatContent(content);

      message.appendChild(contentDiv);
      messagesDiv.appendChild(message);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function formatContent(text) {
      // Simple markdown rendering
      text = text.replace(/\`\`\`(.*?)\n([\s\S]*?)\`\`\`/g,
        '<div class="code-block"><code>$2</code></div>');
      text = text.replace(/\`([^\`]+)\`/g, '<code style="background: var(--vscode-list-hoverBackground); padding: 2px 4px; border-radius: 2px;">$1</code>');
      text = text.replace(/\n/g, '<br>');
      return text;
    }

    function showLoading() {
      const loading = document.createElement('div');
      loading.className = 'message assistant';
      loading.id = 'loading';
      loading.innerHTML = '<div class="message-content loading"><span class="spinner"></span> Thinking...</div>';
      messagesDiv.appendChild(loading);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function updateBudget(remaining, total, limit) {
      const percent = Math.min(((limit - remaining) / limit) * 100, 100);
      costFill.style.width = percent + '%';
      costText.textContent = Math.round(percent) + '%';
      budgetText.textContent = '$' + remaining.toFixed(2) + ' / $' + limit.toFixed(2);

      // Change color based on usage
      if (percent > 95) {
        costFill.style.background = '#d7534a';
      } else if (percent > 75) {
        costFill.style.background = '#dcdcaa';
      } else {
        costFill.style.background = '#4ec9b0';
      }
    }

    // Listen for messages from VSCode
    window.addEventListener('message', (e) => {
      const message = e.data;

      if (message.command === 'addMessage') {
        const loading = document.getElementById('loading');
        if (loading) loading.remove();
        addMessage(message.role, message.content);
      }

      if (message.command === 'updateBudget') {
        updateBudget(message.remaining, message.total, message.limit);
      }
    });
  </script>
</body>
</html>`;
  }

  /**
   * Get current state
   */
  getState(): ChatPanelState {
    return {
      messages: this.messages,
      isLoading: this.isLoading,
      currentBudget: this.currentBudget,
      budgetRemaining: this.budgetRemaining,
      totalCost: this.totalCost,
    };
  }

  /**
   * Set budget
   */
  setBudget(budget: number): void {
    this.currentBudget = budget;
    this.budgetRemaining = budget;
  }

  /**
   * Update budget remaining
   */
  updateBudget(remaining: number): void {
    this.budgetRemaining = remaining;
  }
}

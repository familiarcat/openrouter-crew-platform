import * as vscode from 'vscode';

export class WelcomePanel {
    public static currentPanel: WelcomePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'saveSettings':
                        await this._saveSettings(message.settings);
                        return;
                    case 'testConnection':
                        await this._testConnection(message.apiKey);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (WelcomePanel.currentPanel) {
            WelcomePanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'openrouterCrewWelcome',
            'Welcome to OpenRouter Crew',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'src', 'ui')]
            }
        );

        WelcomePanel.currentPanel = new WelcomePanel(panel, extensionUri);
    }

    public dispose() {
        WelcomePanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _saveSettings(settings: any) {
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        if (settings.apiKey) {
            await config.update('apiKey', settings.apiKey, vscode.ConfigurationTarget.Global);
        }
        if (settings.supabaseUrl) {
            await config.update('supabaseUrl', settings.supabaseUrl, vscode.ConfigurationTarget.Global);
        }
        if (settings.supabaseKey) {
            await config.update('supabaseKey', settings.supabaseKey, vscode.ConfigurationTarget.Global);
        }
        
        vscode.window.showInformationMessage('Configuration saved! You can now use OpenRouter Crew.');
        this._panel.dispose();
    }

    private async _testConnection(apiKey: string) {
        if (!apiKey) {
            vscode.window.showErrorMessage('Please enter an API Key to test.');
            return;
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (response.ok) {
                vscode.window.showInformationMessage('✅ Connection Successful! API Key is valid.');
            } else {
                vscode.window.showErrorMessage(`❌ Connection Failed: ${response.statusText}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Connection Error: ${error}`);
        }
    }

    private _update() {
        this._panel.webview.html = this._getHtmlForWebview();
    }

    private _getHtmlForWebview() {
        // The .vscodeignore file is configured to include this file from src during packaging,
        // and localResourceRoots allows access to it during development.
        const stylePath = vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'welcome-panel.css');
        const styleUri = this._panel.webview.asWebviewUri(stylePath);

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to OpenRouter Crew</title>
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            <div class="container">
                <h1>Welcome to OpenRouter Crew 🚀</h1>
                <p class="info">Configure your API keys to get started with your AI crew.</p>
                
                <label>OpenRouter API Key</label>
                <input type="password" id="apiKey" placeholder="sk-or-..." />
                
                <label>Supabase URL</label>
                <input type="text" id="supabaseUrl" placeholder="https://your-project.supabase.co" />
                
                <label>Supabase Key</label>
                <input type="password" id="supabaseKey" placeholder="your-anon-key" />
                
                <button onclick="testConnection()" style="margin-top: 10px; background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);">Test Connection</button>
                <button onclick="save()">Save Configuration</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                function save() {
                    const apiKey = document.getElementById('apiKey').value;
                    const supabaseUrl = document.getElementById('supabaseUrl').value;
                    const supabaseKey = document.getElementById('supabaseKey').value;
                    if (!apiKey) {
                        return;
                    }
                    vscode.postMessage({
                        command: 'saveSettings',
                        settings: { apiKey, supabaseUrl, supabaseKey }
                    });
                }
                function testConnection() {
                    const apiKey = document.getElementById('apiKey').value;
                    vscode.postMessage({
                        command: 'testConnection',
                        apiKey
                    });
                }
            </script>
        </body>
        </html>`;
    }
}
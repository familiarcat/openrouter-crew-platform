import * as vscode from 'vscode';
import { CrewAPIService } from '../services/crew-api-service.js';

export class MemoryTreeItem extends vscode.TreeItem {
    constructor(
        public readonly memory: any
    ) {
        super(memory.content.substring(0, 60) + (memory.content.length > 60 ? '...' : ''), vscode.TreeItemCollapsibleState.None);
        this.description = memory.type;
        this.tooltip = new vscode.MarkdownString(`**${memory.type.toUpperCase()}**\n\n${memory.content}\n\n_Created: ${new Date(memory.created_at).toLocaleString()}_`);
        this.contextValue = 'memory';
        this.iconPath = new vscode.ThemeIcon(this.getIconForType(memory.type));
    }

    private getIconForType(type: string): string {
        switch (type) {
            case 'insight': return 'light-bulb';
            case 'pattern': return 'symbol-structure';
            case 'lesson': return 'book';
            case 'decision': return 'git-commit';
            default: return 'note';
        }
    }
}

export class MemoryBrowser implements vscode.TreeDataProvider<MemoryTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MemoryTreeItem | undefined | null | void> = new vscode.EventEmitter<MemoryTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MemoryTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private crewService: CrewAPIService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: MemoryTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: MemoryTreeItem): Promise<MemoryTreeItem[]> {
        if (element) {
            return [];
        }

        const memories = await this.crewService.getMemories();
        return memories.map(m => new MemoryTreeItem(m));
    }
}
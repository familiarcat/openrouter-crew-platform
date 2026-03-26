import * as vscode from 'vscode';

export class MaintenanceStatusProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private isMaintenanceActive: boolean = false;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setMaintenanceMode(active: boolean) {
        this.isMaintenanceActive = active;
        this.refresh();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
        // If we are handling nested items, return empty for now
        if (element) {
            return [];
        }

        const items: vscode.TreeItem[] = [];

        // 1. Status Indicator
        const statusItem = new vscode.TreeItem(
            this.isMaintenanceActive ? "System Status: ⚠️ Maintenance Mode" : "System Status: ✅ Operational",
            vscode.TreeItemCollapsibleState.None
        );
        
        // Use built-in product icons (sync~spin requires VSCode 1.50+)
        statusItem.iconPath = new vscode.ThemeIcon(this.isMaintenanceActive ? 'sync~spin' : 'check');
        statusItem.description = this.isMaintenanceActive ? "Pruning Database..." : "Monitoring Active";
        statusItem.contextValue = 'systemStatus';
        
        // Add tooltip for detail
        statusItem.tooltip = this.isMaintenanceActive 
            ? "The system is currently cleaning up expired memories and optimizing indexes."
            : "All systems are running normally. Memory retention policy is active.";

        items.push(statusItem);
        return items;
    }
}
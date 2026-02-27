import * as assert from 'assert';
import * as vscode from 'vscode';
import { CostTracker } from './cost-tracker';

// Mock Memento for globalState
class MockMemento implements vscode.Memento {
    private storage: Map<string, any> = new Map();
    keys(): readonly string[] {
        return Array.from(this.storage.keys());
    }
    get<T>(key: string, defaultValue?: T): T | undefined {
        return this.storage.has(key) ? this.storage.get(key) : defaultValue;
    }
    async update(key: string, value: any): Promise<void> {
        this.storage.set(key, value);
    }
    clear() {
        this.storage.clear();
    }
}

// Mock WorkspaceConfiguration
const mockConfig: vscode.WorkspaceConfiguration = {
    get: (section: string) => {
        if (section === 'budget.daily') return 1.0;
        if (section === 'budget.monthly') return 10.0;
        return undefined;
    },
    has: () => true,
    inspect: () => undefined,
    update: async () => {}
};

suite('CostTracker Service', () => {
    let costTracker: CostTracker;
    let mockMemento: MockMemento;

    setup(() => {
        mockMemento = new MockMemento();
        const mockContext: any = { globalState: mockMemento };

        // Mock vscode.workspace.getConfiguration
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        (vscode.workspace as any).getConfiguration = (section?: string) => {
            if (section === 'openrouterCrew') {
                return mockConfig;
            }
            return originalGetConfiguration(section);
        };

        costTracker = new CostTracker(mockContext);
    });

    test('should record usage and update daily/monthly costs', async () => {
        await costTracker.recordUsage(0.1);
        await costTracker.recordUsage(0.2);

        const dailyMetrics = await costTracker.getCostMetrics('daily');
        const monthlyMetrics = await costTracker.getCostMetrics('monthly');

        assert.strictEqual(parseFloat(dailyMetrics.totalCost.toFixed(2)), 0.30);
        assert.strictEqual(parseFloat(monthlyMetrics.totalCost.toFixed(2)), 0.30);
    });

    test('should allow request when under budget', async () => {
        const result = await costTracker.checkBudget(0.5);
        assert.strictEqual(result.allowed, true);
    });

    test('should deny request when over daily budget', async () => {
        await costTracker.recordUsage(0.8);
        const result = await costTracker.checkBudget(0.3); // 0.8 + 0.3 > 1.0
        assert.strictEqual(result.allowed, false);
        assert.ok(result.reason?.includes('Daily budget'));
    });

    test('should deny request when over monthly budget', async () => {
        await costTracker.recordUsage(9.8);
        const result = await costTracker.checkBudget(0.3); // 9.8 + 0.3 > 10.0
        assert.strictEqual(result.allowed, false);
        assert.ok(result.reason?.includes('Monthly budget'));
    });

    test('should correctly calculate cost metrics', async () => {
        await costTracker.recordUsage(0.25);
        const dailyMetrics = await costTracker.getCostMetrics('daily');

        assert.strictEqual(dailyMetrics.budget, 1.0);
        assert.strictEqual(dailyMetrics.totalCost, 0.25);
        assert.strictEqual(dailyMetrics.remaining, 0.75);
        assert.strictEqual(dailyMetrics.percentUsed, 25);
    });

    test('should reset daily cost', async () => {
        await costTracker.recordUsage(0.5);
        let dailyMetrics = await costTracker.getCostMetrics('daily');
        assert.strictEqual(dailyMetrics.totalCost, 0.5);

        await costTracker.resetCost('daily');
        dailyMetrics = await costTracker.getCostMetrics('daily');
        assert.strictEqual(dailyMetrics.totalCost, 0);
    });
});
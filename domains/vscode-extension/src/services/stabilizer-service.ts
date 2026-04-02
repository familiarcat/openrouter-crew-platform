import * as vscode from 'vscode';
import { execAsync } from './exec';

/**
 * Geordi's Warp Field Stabilizer
 * Monitors local Docker infrastructure and auto-restarts failed services.
 */
export class StabilizerService implements vscode.Disposable {
    private interval: NodeJS.Timeout | undefined;
    private failureCount: Map<string, number> = new Map();

    constructor() {
        this.startMonitoring();
    }

    public startMonitoring() {
        if (this.interval) return;
        this.interval = setInterval(() => this.checkHealth(), 30000); // Level 1 diagnostic every 30s
    }

    private async checkHealth() {
        try {
            const { stdout } = await execAsync('docker ps --format "{{.Names}}:{{.Status}}"');
            const lines = stdout.split('\n').filter(Boolean);

            for (const line of lines) {
                const [name, status] = line.split(':');
                if (status.includes('unhealthy') || status.includes('Exited')) {
                    const count = (this.failureCount.get(name) || 0) + 1;
                    this.failureCount.set(name, count);

                    if (count >= 2) {
                        vscode.window.showWarningMessage(`🔧 Geordi: Warp field collapse detected in ${name}. Re-initializing...`);
                        await execAsync(`docker restart ${name}`);
                        this.failureCount.set(name, 0);
                    }
                } else {
                    this.failureCount.set(name, 0);
                }
            }
        } catch (e) {
            // Engine room static
        }
    }

    dispose() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}
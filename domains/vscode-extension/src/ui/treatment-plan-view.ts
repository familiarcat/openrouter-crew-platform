import * as vscode from 'vscode';
import { AgentExecutionResult } from '../services/types';

/**
 * TreatmentPlanView
 * Renders Dr. Crusher's diagnostic results in a Starfleet Medical Chart UI.
 */
export class TreatmentPlanView {
    constructor(
        private context: vscode.ExtensionContext
    ) {}

    public async show(result: AgentExecutionResult, vitals: { docker: string, cost: string, model: string }) {
        const panel = vscode.window.createWebviewPanel(
            'treatmentPlan',
            'Dr. Crusher: Treatment Plan',
            vscode.ViewColumn.Two,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        panel.webview.html = this.getHtml(result, vitals);
    }

    private getHtml(result: AgentExecutionResult, vitals: { docker: string, cost: string, model: string }): string {
        const date = new Date().toLocaleString();
        const severityClass = result.output.includes('CRITICAL') ? 'crit' : (result.output.includes('HIGH') ? 'warn' : 'stable');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <style>
        :root {
            --chart-bg: #0a0b10;
            --chart-border: #2a3b4d;
            --accent-blue: #4cc9f0;
            --status-crit: #ff4d4d;
            --status-warn: #ffaa00;
            --status-stable: #00ff88;
            --text-main: #e0e6ed;
        }
        body {
            background-color: var(--chart-bg);
            color: var(--text-main);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 25px;
            border: 2px solid var(--chart-border);
            margin: 10px;
        }
        .header {
            border-bottom: 3px double var(--accent-blue);
            padding-bottom: 10px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .header h1 { margin: 0; color: var(--accent-blue); letter-spacing: 2px; font-size: 1.4em; }
        .metadata { font-size: 0.8em; font-family: monospace; opacity: 0.8; }
        
        .section { margin-bottom: 25px; }
        .section-title {
            background: rgba(76, 201, 240, 0.1);
            padding: 5px 15px;
            border-left: 4px solid var(--accent-blue);
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        
        .vitals-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        .vital-card {
            border: 1px solid var(--chart-border);
            padding: 10px;
            background: rgba(255,255,255,0.03);
        }
        .vital-label { font-size: 0.7em; opacity: 0.6; text-transform: uppercase; }
        .vital-value { font-family: monospace; font-size: 0.9em; margin-top: 5px; white-space: pre-wrap; }

        .diagnosis-box {
            line-height: 1.6;
            font-size: 0.95em;
            padding: 0 10px;
        }
        .status-badge {
            padding: 2px 10px;
            border-radius: 10px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .status-crit { background: var(--status-crit); color: black; }
        .status-warn { background: var(--status-warn); color: black; }
        .status-stable { background: var(--status-stable); color: black; }

        .telemetry { font-size: 0.75em; opacity: 0.5; text-align: right; margin-top: 40px; border-top: 1px solid var(--chart-border); padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>STARFLEET MEDICAL: SYSTEMIC DIAGNOSTIC</h1>
            <div class="metadata">PATIENT: OPENROUTER-CREW-PLATFORM // REF: ${Math.random().toString(36).substring(7).toUpperCase()}</div>
        </div>
        <div class="status-badge status-${severityClass}">${severityClass.toUpperCase()}</div>
    </div>

    <div class="section">
        <div class="section-title">Telemetry & Lab Results (Vital Signs)</div>
        <div class="vitals-grid">
            <div class="vital-card">
                <div class="vital-label">Warp Field (Docker)</div>
                <div class="vital-value">${vitals.docker}</div>
            </div>
            <div class="vital-card">
                <div class="vital-label">Metabolism (Cost)</div>
                <div class="vital-value">${vitals.cost}</div>
            </div>
            <div class="vital-card">
                <div class="vital-label">Neural (Models)</div>
                <div class="vital-value">${vitals.model}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Physician's Notes & Treatment Plan</div>
        <div class="diagnosis-box">
            ${result.output.replace(/\n/g, '<br>')}
        </div>
    </div>

    <div class="telemetry">
        CHIEF MEDICAL OFFICER: Beverly Crusher, MD<br>
        TIMESTAMP: ${date} // GEN_COST: $${result.cost.toFixed(6)} // MODEL: ${result.model}
    </div>
</body>
</html>`;
    }
}
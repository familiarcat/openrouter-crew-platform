import * as vscode from 'vscode';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

export class TelemetryService implements vscode.Disposable {
    private context: vscode.ExtensionContext;
    private supabase: SupabaseClient | null = null;
    private anonymousId: string;
    private readonly KEY_ANON_ID = 'openrouter-crew.telemetry.anonymousId';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.anonymousId = this.getOrGenerateAnonymousId();
        this.initSupabase();
    }

    private getOrGenerateAnonymousId(): string {
        let id = this.context.globalState.get<string>(this.KEY_ANON_ID);
        if (!id) {
            id = crypto.randomUUID();
            this.context.globalState.update(this.KEY_ANON_ID, id);
        }
        return id;
    }

    private initSupabase() {
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const url = config.get<string>('supabaseUrl');
        const key = config.get<string>('supabaseAnonKey');

        if (url && key) {
            try {
                this.supabase = createClient(url, key);
            } catch (e) {
                console.error('Failed to initialize Supabase client for telemetry:', e);
            }
        }
    }

    public async sendEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
        if (!this.supabase) return;

        try {
            const extensionId = 'openrouter-crew.openrouter-crew-vscode';
            const extensionVersion = vscode.extensions.getExtension(extensionId)?.packageJSON.version || '0.0.0';

            // Fire and forget insert
            this.supabase.from('telemetry_events').insert({
                anonymous_id: this.anonymousId,
                event: eventName,
                properties: properties,
                timestamp: new Date().toISOString(),
                extension_version: extensionVersion,
                platform: process.platform
            }).then(({ error }) => {
                if (error) {
                    // Silent failure for telemetry to avoid annoying user
                    // console.warn('Telemetry error:', error.message);
                }
            });
        } catch (e) {
            // Silent failure
        }
    }

    public async sendError(error: Error, context?: string): Promise<void> {
        await this.sendEvent('error', {
            message: error.message,
            stack: error.stack,
            context: context
        });
    }

    public async sendActivationEvent(): Promise<void> {
        await this.sendEvent('activation');
    }

    public async sendCommandEvent(commandId: string): Promise<void> {
        await this.sendEvent('command_executed', { command: commandId });
    }

    dispose() {
        // Cleanup if needed
    }
}
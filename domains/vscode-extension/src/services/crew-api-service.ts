import * as vscode from 'vscode';
import { createClient } from '@supabase/supabase-js';
import { CrewAPIClient, AuthContext, MemoryDecayService } from '@openrouter-crew/crew-api-client';

/**
 * CrewAPIClient service for VSCode extension
 * Provides direct API access to CrewAPIClient with VSCode integration
 */
export class CrewAPIService {
  private client: CrewAPIClient | null = null;
  private decayService: MemoryDecayService | null = null;
  private outputChannel: vscode.OutputChannel;
  private userId: string = 'vscode-user';
  private crewId: string = 'default-crew';

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
    this.loadConfiguration();
  }

  /**
   * Load configuration from VSCode settings
   */
  private loadConfiguration() {
    const config = vscode.workspace.getConfiguration('openrouter-crew');
    this.userId = config.get<string>('userId') || 'vscode-user';
    this.crewId = config.get<string>('crewId') || 'default-crew';
  }

  /**
   * Initialize CrewAPIClient if not already initialized
   */
  private async initializeClient(): Promise<CrewAPIClient> {
    if (this.client) {
      return this.client;
    }

    const config = vscode.workspace.getConfiguration('openrouter-crew');
    const supabaseUrl = config.get<string>('supabaseUrl');
    const supabaseKey = config.get<string>('supabaseKey');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase credentials not configured. Set openrouter-crew.supabaseUrl and openrouter-crew.supabaseKey'
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    this.client = new CrewAPIClient(supabase);
    this.decayService = new MemoryDecayService(supabase);

    return this.client;
  }

  /**
   * Get auth context for IDE operations
   */
  private getAuthContext(overrides?: Partial<AuthContext>): AuthContext {
    return {
      user_id: overrides?.user_id || this.userId,
      crew_id: overrides?.crew_id || this.crewId,
      role: overrides?.role || 'member',
      surface: 'ide',
      tenant_id: overrides?.tenant_id,
    };
  }

  /**
   * Create a new memory from current selection or input
   */
  async createMemory(
    content?: string,
    type: 'story' | 'insight' | 'pattern' | 'lesson' | 'best-practice' = 'insight'
  ): Promise<void> {
    try {
      const client = await this.initializeClient();
      const context = this.getAuthContext();

      // Use provided content or ask user
      let memoryContent = content;
      if (!memoryContent) {
        memoryContent = await vscode.window.showInputBox({
          prompt: 'Enter memory content',
          placeHolder: 'Describe what you want to remember...',
        });

        if (!memoryContent) {
          return; // User cancelled
        }
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Creating memory...',
          cancellable: false,
        },
        async () => {
          const result = await client.create_memory(
            {
              content: memoryContent,
              type,
              tags: ['ide', 'vscode'],
            },
            context
          );

          this.outputChannel.appendLine(`✓ Memory created: ${result.id} (cost: $${result.cost.toFixed(4)})`);
          vscode.window.showInformationMessage(`Memory created successfully! (Cost: $${result.cost.toFixed(4)})`);
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`✗ Failed to create memory: ${message}`);
      vscode.window.showErrorMessage(`Failed to create memory: ${message}`);
    }
  }

  /**
   * Search memories
   */
  async searchMemories(query?: string): Promise<void> {
    try {
      const client = await this.initializeClient();
      const context = this.getAuthContext();

      // Get search query
      let searchQuery = query;
      if (!searchQuery) {
        searchQuery = await vscode.window.showInputBox({
          prompt: 'Search memories',
          placeHolder: 'Enter search term...',
        });

        if (!searchQuery) {
          return; // User cancelled
        }
      }

      let results;
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Searching for "${searchQuery}"...`,
          cancellable: false,
        },
        async () => {
          results = await client.search_memories(
            {
              query: searchQuery,
              limit: 10,
            },
            context
          );
        }
      );

      if (!results || results.length === 0) {
        vscode.window.showInformationMessage('No memories found');
        return;
      }

      // Show results in output channel
      this.outputChannel.clear();
      this.outputChannel.appendLine(`Found ${results.length} memories:`);
      this.outputChannel.appendLine('');

      results.forEach((memory: any, index: number) => {
        this.outputChannel.appendLine(
          `${index + 1}. [${memory.type.toUpperCase()}] ${memory.content.substring(0, 60)}...`
        );
        this.outputChannel.appendLine(`   ID: ${memory.id}`);
        this.outputChannel.appendLine(`   Confidence: ${(memory.confidence_level * 100).toFixed(0)}%`);
        this.outputChannel.appendLine('');
      });

      this.outputChannel.show();
      vscode.window.showInformationMessage(`Found ${results.length} memories (see output for details)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`✗ Failed to search memories: ${message}`);
      vscode.window.showErrorMessage(`Failed to search memories: ${message}`);
    }
  }

  /**
   * Get compliance status
   */
  async getComplianceStatus(): Promise<void> {
    try {
      const client = await this.initializeClient();
      const context = this.getAuthContext();

      let status;
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Checking compliance...',
          cancellable: false,
        },
        async () => {
          status = await client.compliance_status(
            {
              crew_id: context.crew_id,
              period: '30d',
            },
            context
          );
        }
      );

      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('=== GDPR Compliance Status ===');
      this.outputChannel.appendLine(`Period: ${status.period}`);
      this.outputChannel.appendLine(`Total Memories: ${status.total_memories}`);
      this.outputChannel.appendLine(`Deleted Memories: ${status.deleted_memories}`);
      this.outputChannel.appendLine(`Recovery Window: ${status.recovery_window_days} days`);
      this.outputChannel.appendLine(
        `GDPR Compliant: ${status.gdpr_compliant ? '✓ Yes' : '✗ No'}`
      );
      this.outputChannel.appendLine('');
      this.outputChannel.show();

      const message = status.gdpr_compliant
        ? '✓ Your crew memories are GDPR compliant'
        : '⚠ Your crew memories may not be GDPR compliant';

      vscode.window.showInformationMessage(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`✗ Failed to check compliance: ${message}`);
      vscode.window.showErrorMessage(`Failed to check compliance: ${message}`);
    }
  }

  /**
   * Get expiration forecast
   */
  async getExpirationForecast(): Promise<void> {
    try {
      const client = await this.initializeClient();
      const context = this.getAuthContext();

      let forecast;
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Forecasting expiration...',
          cancellable: false,
        },
        async () => {
          forecast = await client.expiration_forecast(
            {
              crew_id: context.crew_id,
            },
            context
          );
        }
      );

      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('=== Memory Expiration Forecast ===');
      this.outputChannel.appendLine(`Expiring Soon: ${forecast.expiring_soon} memories`);
      this.outputChannel.appendLine(`Expiring in 30 days: ${forecast.expiring_30days} memories`);
      this.outputChannel.appendLine(`Expiring in 90 days: ${forecast.expiring_90days} memories`);
      this.outputChannel.appendLine('');
      this.outputChannel.show();

      vscode.window.showInformationMessage(
        `Memory forecast updated (${forecast.expiring_soon} expiring soon)`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`✗ Failed to forecast expiration: ${message}`);
      vscode.window.showErrorMessage(`Failed to forecast expiration: ${message}`);
    }
  }

  /**
   * Execute a crew
   */
  async executeCrew(input?: string): Promise<void> {
    try {
      const client = await this.initializeClient();
      const context = this.getAuthContext();

      // Get input
      let crewInput = input;
      if (!crewInput) {
        crewInput = await vscode.window.showInputBox({
          prompt: 'Execute crew with input',
          placeHolder: 'Describe the task...',
        });

        if (!crewInput) {
          return; // User cancelled
        }
      }

      let result;
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Executing crew...',
          cancellable: false,
        },
        async () => {
          result = await client.execute_crew(
            {
              crew_id: context.crew_id,
              input: crewInput,
            },
            context
          );
        }
      );

      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('=== Crew Execution Result ===');
      this.outputChannel.appendLine(`Execution ID: ${result.execution_id}`);
      this.outputChannel.appendLine(`Status: ${result.status}`);
      this.outputChannel.appendLine(`Duration: ${result.duration_ms}ms`);
      this.outputChannel.appendLine(`Cost: $${result.cost.toFixed(4)}`);
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('Output:');
      this.outputChannel.appendLine(result.output);
      this.outputChannel.appendLine('');
      this.outputChannel.show();

      vscode.window.showInformationMessage(
        `Crew execution completed (Cost: $${result.cost.toFixed(4)})`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`✗ Failed to execute crew: ${message}`);
      vscode.window.showErrorMessage(`Failed to execute crew: ${message}`);
    }
  }

  /**
   * Show retention statistics for the crew
   */
  async showRetentionStatistics(): Promise<void> {
    try {
      await this.initializeClient();

      if (!this.decayService) {
        throw new Error('Decay service not initialized');
      }

      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('=== Memory Retention Statistics ===');
      this.outputChannel.appendLine(`Crew: ${this.crewId}`);

      const stats = await this.decayService.getRetentionStatistics(this.crewId);

      this.outputChannel.appendLine(`Total Memories: ${stats.totalMemories}`);
      this.outputChannel.appendLine(`Active Memories: ${stats.activeMemories}`);
      this.outputChannel.appendLine(`Soft-Deleted: ${stats.softDeletedMemories}`);
      this.outputChannel.appendLine(`Expiring in 7 days: ${stats.expiringIn7Days}`);
      this.outputChannel.appendLine(`Expiring in 30 days: ${stats.expiringIn30Days}`);
      this.outputChannel.appendLine(`Average Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);

      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('By Retention Tier:');
      Object.entries(stats.memoryByTier).forEach(([tier, count]) => {
        this.outputChannel.appendLine(`  ${tier}: ${count}`);
      });

      this.outputChannel.appendLine('');
      this.outputChannel.show();

      vscode.window.showInformationMessage('Retention statistics displayed');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`✗ Failed to get retention statistics: ${message}`);
      vscode.window.showErrorMessage(`Failed to get retention statistics: ${message}`);
    }
  }

  /**
   * Show memories expiring soon
   */
  async showExpiringMemories(daysUntilExpiration: number = 7): Promise<void> {
    try {
      await this.initializeClient();

      const decayService = this.decayService;
      if (!decayService) {
        throw new Error('Decay service not initialized');
      }

      this.outputChannel.appendLine('');
      this.outputChannel.appendLine(`=== Memories Expiring in ${daysUntilExpiration} Days ===`);

      const memories = (await decayService.findExpiringMemories(this.crewId, daysUntilExpiration)) || [];

      if (!Array.isArray(memories) || memories.length === 0) {
        this.outputChannel.appendLine('No memories expiring soon');
        this.outputChannel.show();
        return;
      }

      (memories as any[]).forEach((memory: any) => {
        const metrics = decayService.getDecayMetrics(memory);
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine(`ID: ${memory.id}`);
        this.outputChannel.appendLine(`Content: ${memory.content.substring(0, 60)}...`);
        this.outputChannel.appendLine(`Type: ${memory.type}`);
        this.outputChannel.appendLine(`Confidence: ${(metrics.currentConfidence * 100).toFixed(1)}%`);
        this.outputChannel.appendLine(`Days Until Expiration: ${Math.ceil(metrics.daysUntilExpiration)}`);
      });

      this.outputChannel.appendLine('');
      this.outputChannel.show();

      vscode.window.showInformationMessage(`Found ${memories.length} memories expiring soon`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`✗ Failed to find expiring memories: ${message}`);
      vscode.window.showErrorMessage(`Failed to find expiring memories: ${message}`);
    }
  }

  /**
   * Show memories ready for hard deletion
   */
  async showMemoriesReadyForDeletion(): Promise<void> {
    try {
      await this.initializeClient();

      const decayService = this.decayService;
      if (!decayService) {
        throw new Error('Decay service not initialized');
      }

      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('=== Memories Ready for Permanent Deletion ===');

      const memories = (await decayService.findMemoriesReadyForHardDelete(this.crewId)) || [];

      if (!Array.isArray(memories) || memories.length === 0) {
        this.outputChannel.appendLine('No memories ready for deletion');
        this.outputChannel.show();
        return;
      }

      this.outputChannel.appendLine(`Found ${memories.length} memories beyond recovery window:`);
      this.outputChannel.appendLine('');

      (memories as any[]).forEach((memory: any) => {
        this.outputChannel.appendLine(`ID: ${memory.id}`);
        this.outputChannel.appendLine(`Deleted at: ${new Date(memory.deleted_at || '').toLocaleString()}`);
        this.outputChannel.appendLine(`Content: ${memory.content.substring(0, 60)}...`);
        this.outputChannel.appendLine('---');
      });

      this.outputChannel.appendLine('');
      this.outputChannel.show();

      vscode.window.showInformationMessage(`${memories.length} memories ready for permanent deletion`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`✗ Failed to find memories ready for deletion: ${message}`);
      vscode.window.showErrorMessage(`Failed to find memories ready for deletion: ${message}`);
    }
  }
}

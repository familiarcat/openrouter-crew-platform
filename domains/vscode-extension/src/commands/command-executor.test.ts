import * as assert from 'assert';
import * as vscode from 'vscode';
import { CommandExecutor } from '../../src/commands/command-executor.js';
import { AgentNetworkService } from '../../src/services/agent-network.js';
import { ToolRegistry } from '../../src/services/tool-registry.js';
import { TerminalManager } from '../../src/services/terminal-manager.js';
import { LLMResponse } from '../../src/services/llm-router.js';

suite('CommandExecutor Test Suite', () => {
    let commandExecutor: CommandExecutor;
    let mockNetwork: any;
    let mockToolRegistry: any;
    let mockTerminal: any;
    let mockOutputChannel: any;
    let mockLLMRouter: any;

    setup(() => {
        // Mock dependencies
        mockNetwork = {
            getDepartment: () => ({
                profile: { name: 'Test Agent', role: 'Tester' },
                executeTask: async () => ({
                    output: 'Test content',
                    model: 'test-model',
                    cost: 0.001,
                    executionTimeMs: 100
                })
            })
        };
        mockToolRegistry = {};
        mockTerminal = {};
        mockOutputChannel = {
            show: () => {},
            appendLine: () => {}
        };
        mockLLMRouter = {
            route: async () => ({ content: 'lead' })
        };

        commandExecutor = new CommandExecutor(
            mockNetwork as AgentNetworkService,
            mockToolRegistry as ToolRegistry,
            mockTerminal as TerminalManager,
            mockOutputChannel as vscode.OutputChannel,
            mockLLMRouter as any
        );
    });

    test('execute handles successful response correctly', async () => {
        // We use 'executeTask' directly
        const result = await commandExecutor.executeTask('test prompt');

        assert.strictEqual(result.output, 'Test content');
        assert.strictEqual(result.model, 'test-model');
        assert.strictEqual(result.cost, 0.001);
    });

    test('execute handles agent failure', async () => {
        mockNetwork.getDepartment = () => ({
            profile: { name: 'Test Agent' },
            executeTask: async () => { throw new Error('Agent error'); }
        });

        try {
            await commandExecutor.executeTask('test prompt');
            assert.fail('Should have thrown error');
        } catch (e: any) {
            assert.strictEqual(e.message, 'Agent error');
        }
    });
});
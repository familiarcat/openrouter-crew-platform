import * as assert from 'assert';
import * as vscode from 'vscode';
import { CommandExecutor } from '../../src/commands/command-executor.js';
import { AgentNetworkService } from '../../src/services/agent-network.js';
import { ToolRegistry } from '../../src/services/tool-registry.js';
import { TerminalManager } from '../../src/services/terminal-manager.js';
import { NLPProcessor } from '../../src/services/nlp-processor.js';

suite('CommandExecutor Test Suite', () => {
    let commandExecutor: CommandExecutor;
    let mockNetwork: any;
    let mockToolRegistry: any;
    let mockTerminal: any;
    let mockOutputChannel: any;
    let mockLLMRouter: any;
    let mockNLPProcessor: any;

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
        mockNLPProcessor = {
            detectIntent: async () => ({
                intent: 'ASK',
                complexity: 'LOW',
                entities: [],
                keywords: [],
                suggestedModel: 'test-model'
            })
        };

        commandExecutor = new CommandExecutor(
            mockNetwork as AgentNetworkService,
            mockToolRegistry as ToolRegistry,
            mockTerminal as TerminalManager,
            mockOutputChannel as vscode.OutputChannel,
            mockLLMRouter as any,
            mockNLPProcessor as NLPProcessor
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

    test('executeTask enhances context with NLP results', async () => {
        let capturedContext: any;
        mockNetwork.getDepartment = () => ({
            profile: { name: 'Test Agent', role: 'Tester' },
            executeTask: async (task: string, context: any) => {
                capturedContext = context;
                return {
                    output: 'Test content',
                    model: 'test-model',
                    cost: 0.001,
                    executionTimeMs: 100
                };
            }
        });

        mockNLPProcessor.detectIntent = async (task: string) => ({
            intent: 'DEBUG',
            complexity: 'HIGH',
            entities: [],
            keywords: [],
            suggestedModel: 'claude-3-5-sonnet'
        });

        await commandExecutor.executeTask('fix this bug', { original: 'context' });

        assert.deepStrictEqual(capturedContext, { original: 'context', intent: 'DEBUG', complexity: 'HIGH' });
    });
});
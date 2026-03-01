import * as assert from 'assert';
import { testCommand } from './test.js';
import { CommandTestContext } from './command-test-utils.js';
import { ChatPanel } from '../ui/chat-panel.js';

suite('Test Generation Command Test Suite', () => {
    let testContext: CommandTestContext;
    let askedPrompt: string | undefined;

    setup(() => {
        testContext = new CommandTestContext();
        askedPrompt = undefined;
        // Mock ChatPanel
        ChatPanel.currentPanel = {
            ask: async (prompt: string) => {
                askedPrompt = prompt;
            }
        } as any;
    });

    teardown(() => {
        testContext.restore();
        ChatPanel.currentPanel = undefined;
    });

    test('should generate tests for selected code', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'function add(a,b) { return a+b; }',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        await testCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger,
            testContext.fileManager
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('function add(a,b) { return a+b; }'));
        assert.ok(askedPrompt.includes('Generate comprehensive unit tests'));
    });
});
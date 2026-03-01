import * as assert from 'assert';
import { reviewCommand } from './review.js';
import { CommandTestContext } from './command-test-utils.js';
import { ChatPanel } from '../ui/chat-panel.js';

suite('Review Command Test Suite', () => {
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

    test('should review selected code', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'const x = 1;',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        await reviewCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger,
            testContext.fileManager
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('const x = 1;'));
        assert.ok(askedPrompt.includes('Perform a comprehensive code review'));
    });
});
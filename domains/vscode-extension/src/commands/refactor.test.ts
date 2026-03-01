import * as assert from 'assert';
import { refactorCommand } from './refactor.js';
import { CommandTestContext } from './command-test-utils.js';
import { ChatPanel } from '../ui/chat-panel.js';

suite('Refactor Command Test Suite', () => {
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

    test('should send correct prompt to ChatPanel with selected quick pick option', async () => {
        testContext.mockQuickPick({ label: 'Improve readability and clarity' });

        await refactorCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('Instruction: Improve readability and clarity'));
        assert.ok(askedPrompt.includes('const x = 1;'));
    });

    test('should handle custom instruction input', async () => {
        testContext.mockQuickPick({ label: 'Custom instruction...' });
        testContext.mockInputBox('My custom refactor');

        await refactorCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('Instruction: My custom refactor'));
    });
});
import * as assert from 'assert';
import { terminalCommand } from './terminal.js';
import { CommandTestContext } from './command-test-utils.js';
import { ChatPanel } from '../ui/chat-panel.js';

suite('Terminal Command Test Suite', () => {
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

    test('should send correct prompt to ChatPanel', async () => {
        testContext.mockInputBox('list files');

        await terminalCommand(
            testContext.commandExecutor,
            testContext.terminalManager,
            testContext.outputLogger
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('Generate a terminal command to: list files'));
    });
});
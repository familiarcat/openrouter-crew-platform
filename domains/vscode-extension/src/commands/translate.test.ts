import * as assert from 'assert';
import { translateCommand } from './translate.js';
import { CommandTestContext } from './command-test-utils.js';
import { ChatPanel } from '../ui/chat-panel.js';

suite('Translate Command Test Suite', () => {
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

    test('should translate selected code', async () => {
        // Mock selection
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '// comment',
            fileContent: '// comment',
            languageId: 'typescript',
            selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
        });

        // Mock language selection
        testContext.mockQuickPick('Spanish');

        await translateCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('Translate the comments in the following code to Spanish'));
        assert.ok(askedPrompt.includes('// comment'));
    });
});
import * as assert from 'assert';
import { findRelatedFilesCommand } from './find-related-files.js';
import { CommandTestContext } from '../test/command-test-utils.js';
import { ChatPanel } from '../ui/chat-panel.js';

suite('Find Related Files Command Test Suite', () => {
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

    test('should construct prompt with selected code', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'const x = 1;',
            fileContent: 'const x = 1; const y = 2;',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        await findRelatedFilesCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.fileManager
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('const x = 1;'));
        assert.ok(!askedPrompt.includes('const y = 2;'));
        assert.ok(askedPrompt.includes('find related files'));
    });

    test('should construct prompt with file content if no selection', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '',
            fileContent: 'full file content',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        await findRelatedFilesCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            test.fileManager
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('full file content'));
    });
});
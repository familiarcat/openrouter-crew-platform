import * as assert from 'assert';
import { documentCommand } from './document.js';
import { CommandTestContext } from './command-test-utils.js';
import { ChatPanel } from '../ui/chat-panel.js';

suite('Document Command Test Suite', () => {
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

    test('should document selected code', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'function foo() {}',
            selectionRange: { start: { line: 0 }, end: { line: 0 } },
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        await documentCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger,
            testContext.fileManager
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('function foo() {}'));
        assert.ok(askedPrompt.includes('Generate comprehensive documentation'));
    });

    test('should suggest undocumented nodes if no selection', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '',
            fileContent: 'function foo() {}',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        testContext.fileManager.analyzeFile = async () => ({
            nodes: [{ type: 'function', name: 'foo', startLine: 1, content: 'function foo() {}' }],
            filePath: '/test/file.ts', language: 'typescript', imports: [], exports: [], complexity: 1,
            issues: []
        });

        testContext.mockQuickPick({ 
            node: { name: 'foo', content: 'function foo() {}' } 
        });

        // Execution flow verification handled by mocks returning success
        await documentCommand(testContext.commandExecutor, testContext.contextProvider, testContext.outputLogger, testContext.fileManager);
        
        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('function foo() {}'));
    });
});
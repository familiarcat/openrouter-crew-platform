import * as assert from 'assert';
import { optimizeCommand } from './optimize.js';
import { CommandTestContext } from './command-test-utils.js';
import { ChatPanel } from '../ui/chat-panel.js';

suite('Optimize Command Test Suite', () => {
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

    test('should optimize selected code', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'slow code',
            selectionRange: { start: { line: 0 }, end: { line: 1 } },
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        await optimizeCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger,
            testContext.fileManager
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('Optimize this code'));
        assert.ok(askedPrompt.includes('slow code'));
    });

    test('should suggest optimizations if no selection', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '',
            fileContent: 'full content',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        testContext.fileManager.analyzeFile = async () => ({
            nodes: [],
            filePath: '/test/file.ts', language: 'typescript', imports: [], exports: [], complexity: 1,
            issues: ['High complexity']
        });

        testContext.fileManager.generateSuggestions = () => [{
            issue: 'High complexity',
            suggestion: 'Split function',
            priority: 'high'
        }];

        testContext.mockQuickPick({ suggestion: { issue: 'High complexity', suggestion: 'Split function' } });

        await optimizeCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger,
            testContext.fileManager
        );
        
        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('Optimize this specific issue: High complexity'));
    });
});
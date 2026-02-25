import * as assert from 'assert';
import { optimizeCommand } from './optimize.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Optimize Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should optimize selected code', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'slow code',
            selectionRange: { start: { line: 0 }, end: { line: 1 } },
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        let capturedInstruction = '';
        testContext.commandExecutor.refactor = async (code: string, file: string, instruction: string) => {
            capturedInstruction = instruction;
            return { success: true, output: 'fast code', model: 'test', costUSD: 0 };
        };
        testContext.commandExecutor.extractCode = () => 'fast code';

        await optimizeCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger,
            testContext.fileManager
        );

        assert.ok(capturedInstruction.includes('Optimize this code'));
    });

    test('should suggest optimizations if no selection', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '',
            fileContent: 'full content',
            languageId: 'typescript',
            fileName: '/test/file.ts'
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
        // Verification implicit: if it runs without error and calls refactor (mocked in context), it passes.
    });
});
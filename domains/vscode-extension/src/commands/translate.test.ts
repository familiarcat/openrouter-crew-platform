import * as assert from 'assert';
import { translateCommand } from './translate.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Translate Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
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

        let capturedCode = '';
        let capturedLanguage = '';
        testContext.commandExecutor.translate = async (code: string, language: string) => {
            capturedCode = code;
            capturedLanguage = language;
            return { success: true, output: '```\n// comentario\n```', model: 'test', costUSD: 0 };
        };
        
        testContext.commandExecutor.extractCode = (output: string) => '// comentario';

        await translateCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.strictEqual(capturedCode, '// comment');
        assert.strictEqual(capturedLanguage, 'Spanish');
    });
});
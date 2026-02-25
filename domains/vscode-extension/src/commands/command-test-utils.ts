import * as vscode from 'vscode';

export class CommandTestContext {
    // Service Mocks
    public commandExecutor: any;
    public contextProvider: any;
    public outputLogger: any;
    public fileManager: any;
    public terminalManager: any;
    public crewService: any;
    public cliExecutor: any;
    public costTracker: any;
    public costEstimator: any;

    // VS Code API Stubs
    private originalShowQuickPick: any;
    private originalShowInputBox: any;
    private originalShowOpenDialog: any;
    private originalShowErrorMessage: any;
    private originalShowWarningMessage: any;
    private originalShowInformationMessage: any;
    private originalWithProgress: any;
    private originalActiveTextEditor: any;
    private originalClipboard: any;
    private originalFs: any;

    constructor() {
        this.setupMocks();
    }

    private setupMocks() {
        // 1. Services
        this.commandExecutor = {
            refactor: async () => this.successResult(),
            generate: async () => this.successResult(),
            explain: async () => this.successResult(),
            debug: async () => this.successResult(),
            optimize: async () => this.successResult(),
            test: async () => this.successResult(),
            document: async () => this.successResult(),
            explainTerminal: async () => this.successResult(),
            terminal: async () => this.successResult(),
            analyzeComplexity: async () => this.successResult(),
            translate: async () => this.successResult(),
            processImage: async () => this.successResult(),
            estimateImageCost: async () => ({ cost: 0.01, model: 'test', inputTokens: 100, outputTokens: 100, complexity: 'LOW' }),
            extractCode: (output: string) => output,
            generateTests: async () => this.successResult(),
            review: async () => this.successResult(),
            structure: async () => this.successResult(),
        };

        this.contextProvider = {
            getEditorContext: () => ({
                selectedCode: 'const x = 1;',
                fileContent: 'const x = 1;',
                languageId: 'typescript',
                selectionRange: new vscode.Range(0, 0, 0, 10),
                fileName: '/test/file.ts'
            })
        };

        this.outputLogger = {
            logExchange: () => {}
        };

        this.fileManager = {
            analyzeFile: () => ({
                language: 'typescript',
                nodes: [],
                imports: [],
                exports: [],
                complexity: 1,
                issues: []
            }),
            generateSuggestions: () => [],
            getProjectStructure: async () => ['file1.ts', 'file2.ts']
        };

        this.terminalManager = {
            executeCommand: async () => true
        };

        this.crewService = {
            getCrewRoster: async () => [],
            consultCrew: async () => {},
            createMemory: async () => {},
            searchMemories: async () => {},
            getComplianceStatus: async () => {}
        };
        
        this.cliExecutor = {
             createProject: async () => ({ success: true }),
             createFeature: async () => ({ success: true })
        };

        this.costTracker = {
            resetDailyUsage: async () => {}
        };

        this.costEstimator = {
            estimateRequestCost: () => ({ cost: 0.01, model: 'test', inputTokens: 100, outputTokens: 100, complexity: 'LOW' })
        };

        // 2. VS Code API
        this.originalShowQuickPick = vscode.window.showQuickPick;
        this.originalShowInputBox = vscode.window.showInputBox;
        this.originalShowOpenDialog = vscode.window.showOpenDialog;
        this.originalShowErrorMessage = vscode.window.showErrorMessage;
        this.originalShowWarningMessage = vscode.window.showWarningMessage;
        this.originalShowInformationMessage = vscode.window.showInformationMessage;
        this.originalWithProgress = vscode.window.withProgress;
        this.originalActiveTextEditor = vscode.window.activeTextEditor;
        this.originalClipboard = vscode.env.clipboard;
        this.originalFs = vscode.workspace.fs;

        // Default implementations
        (vscode.window as any).withProgress = async (_opts: any, callback: any) => callback();
        (vscode.window as any).showErrorMessage = async () => {};
        (vscode.window as any).showWarningMessage = async () => {};
        (vscode.window as any).showInformationMessage = async () => {};
        
        // Mock Active Editor
        (vscode.window as any).activeTextEditor = {
            document: { 
                fileName: '/test/file.ts',
                languageId: 'typescript',
                getText: () => 'const x = 1;',
                lineCount: 10,
                lineAt: () => ({ range: new vscode.Range(0,0,0,10), text: '' }),
                uri: vscode.Uri.file('/test/file.ts')
            },
            selection: new vscode.Selection(0, 0, 0, 10),
            edit: async (callback: any) => {
                const editBuilder = { replace: () => {}, insert: () => {}, delete: () => {} };
                callback(editBuilder);
                return true;
            }
        };

        // Mock File System
        (vscode.workspace as any).fs = {
            readFile: async () => new Uint8Array(),
            writeFile: async () => {},
            createDirectory: async () => {},
            delete: async () => {},
            rename: async () => {}
        };
    }

    restore() {
        vscode.window.showQuickPick = this.originalShowQuickPick;
        vscode.window.showInputBox = this.originalShowInputBox;
        vscode.window.showOpenDialog = this.originalShowOpenDialog;
        vscode.window.showErrorMessage = this.originalShowErrorMessage;
        vscode.window.showWarningMessage = this.originalShowWarningMessage;
        vscode.window.showInformationMessage = this.originalShowInformationMessage;
        vscode.window.withProgress = this.originalWithProgress;
        (vscode.window as any).activeTextEditor = this.originalActiveTextEditor;
        (vscode.env as any).clipboard = this.originalClipboard;
        (vscode.workspace as any).fs = this.originalFs;
    }

    // Helpers
    mockQuickPick(result: any) {
        (vscode.window as any).showQuickPick = async () => result;
    }

    mockInputBox(result: string | undefined) {
        (vscode.window as any).showInputBox = async () => result;
    }

    mockOpenDialog(result: vscode.Uri[] | undefined) {
        (vscode.window as any).showOpenDialog = async () => result;
    }

    mockReadFile(content: Uint8Array) {
        (vscode.workspace as any).fs.readFile = async () => content;
    }
    
    mockClipboard(text: string) {
        (vscode.env as any).clipboard = {
            readText: async () => text,
            writeText: async () => {}
        };
    }

    private successResult() {
        return {
            success: true,
            output: 'AI generated content',
            model: 'test-model',
            costUSD: 0.001,
            executionTimeMs: 100,
            metadata: {}
        };
    }
}
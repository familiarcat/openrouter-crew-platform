const fs = require('fs');
const path = require('path');
const { fixConfig } = require('./fix-tsconfig-corruption');

jest.mock('fs');

describe('fix-tsconfig-corruption', () => {
    const mockWriteFileSync = jest.fn();
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    beforeEach(() => {
        jest.clearAllMocks();
        fs.writeFileSync = mockWriteFileSync;
        // Default mock implementations
        fs.readFileSync.mockReturnValue('{}');
        fs.existsSync.mockReturnValue(false);
        fs.statSync.mockReturnValue({ isDirectory: () => false });
    });

    afterAll(() => {
        mockConsoleLog.mockRestore();
        mockConsoleError.mockRestore();
    });

    test('should set moduleResolution to Bundler for Next.js projects', () => {
        const configPath = path.join('/abs/path/to/next-app', 'tsconfig.json');
        const projectDir = path.dirname(configPath);
        
        fs.readFileSync.mockReturnValue(JSON.stringify({
            compilerOptions: { moduleResolution: 'Node' }
        }));
        
        // Mock existsSync to return true for next.config.js
        fs.existsSync.mockImplementation((p) => {
            return p === path.join(projectDir, 'next.config.js');
        });

        fixConfig(configPath);

        expect(mockWriteFileSync).toHaveBeenCalled();
        const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1]);
        expect(writtenConfig.compilerOptions.moduleResolution).toBe('Bundler');
        expect(writtenConfig.compilerOptions.module).toBe('ESNext');
    });

    test('should set moduleResolution to Node for Node.js projects', () => {
        const configPath = path.join('/abs/path/to/node-lib', 'tsconfig.json');
        
        fs.readFileSync.mockReturnValue(JSON.stringify({
            compilerOptions: { moduleResolution: 'Bundler' }
        }));
        
        // Mock existsSync to return false for next.config.js/mjs
        fs.existsSync.mockReturnValue(false);

        fixConfig(configPath);

        expect(mockWriteFileSync).toHaveBeenCalled();
        const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1]);
        expect(writtenConfig.compilerOptions.moduleResolution).toBe('Node');
    });

    test('should remove unnecessary baseUrl', () => {
        const configPath = path.join('/abs/path/to/lib', 'tsconfig.json');
        
        fs.readFileSync.mockReturnValue(JSON.stringify({
            compilerOptions: { 
                moduleResolution: 'Node',
                baseUrl: '.',
                target: 'ES2022'
            }
        }));
        
        fs.existsSync.mockReturnValue(false);

        fixConfig(configPath);

        expect(mockWriteFileSync).toHaveBeenCalled();
        const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1]);
        expect(writtenConfig.compilerOptions.baseUrl).toBeUndefined();
    });

    test('should add missing baseUrl if paths are present', () => {
        const configPath = path.join('/abs/path/to/lib', 'tsconfig.json');
        
        fs.readFileSync.mockReturnValue(JSON.stringify({
            compilerOptions: { 
                moduleResolution: 'Node',
                target: 'ES2022',
                paths: { '@/*': ['./src/*'] }
            }
        }));
        
        fs.existsSync.mockReturnValue(false);

        fixConfig(configPath);

        expect(mockWriteFileSync).toHaveBeenCalled();
        const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1]);
        expect(writtenConfig.compilerOptions.baseUrl).toBe('.');
    });
});
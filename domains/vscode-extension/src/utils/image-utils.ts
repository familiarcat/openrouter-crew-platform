import * as vscode from 'vscode';

export async function selectImage(openLabel: string = 'Select Image'): Promise<vscode.Uri | undefined> {
    const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: openLabel,
        filters: {
            'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp']
        }
    };

    const fileUri = await vscode.window.showOpenDialog(options);
    if (!fileUri || fileUri.length === 0) {
        return undefined;
    }

    return fileUri[0];
}

export async function convertImageToBase64(uri: vscode.Uri): Promise<string> {
    const fileData = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(fileData).toString('base64');
}
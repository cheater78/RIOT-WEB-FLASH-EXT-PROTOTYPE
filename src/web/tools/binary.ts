import * as vscode from 'vscode';

/**
 * Loads a binary file given its @param file_path and returns its as binary string
 * @param file_path of the binary file
 * @returns contents as binary string
 */
export async function loadBinary(file: vscode.Uri): Promise<string> {
    return new Promise(
        (resolve, reject) => {
            vscode.workspace.fs.readFile(file).then(
                (value: Uint8Array<ArrayBufferLike>) => resolve([...new Uint8Array(value)].map(v => String.fromCharCode(v)).join('')),
                () => {
                    vscode.window.showErrorMessage('Failed to read file: ' + file.toString())
                    reject('Failed to read file: ' + file.toString())
                    return;
                }
            )
        }
    );
}
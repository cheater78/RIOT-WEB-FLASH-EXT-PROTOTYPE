import * as vscode from "vscode";

export class ControlPanelProvider implements vscode.WebviewViewProvider {
    constructor(private basePath: vscode.Uri) {}

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): Thenable<void> | void {
        const cssSrc = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.basePath, 'resources', 'css', 'styles.css'));
        webviewView.webview.options = {
            enableScripts: true
        };
        webviewView.webview.onDidReceiveMessage(
            () => {
                vscode.commands.executeCommand('riot-web-extension.serial.register');
            }
        );
        webviewView.webview.html = `
        <!DOCTYPE html>
        <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Control Panel</title>
                <link rel="stylesheet" href="${cssSrc}">
            </head>
            <body style="text-align: center">
                <br/>
                <button onclick="myFunction()">Hallo</button>
                <script>
                    const vscode = acquireVsCodeApi();
                    function myFunction() {
                        vscode.postMessage('test')
                    }
                </script>
            </body>
        </html>
        `;
    }
}
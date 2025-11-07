import * as vscode from "vscode";

export class ControlPanelProvider implements vscode.WebviewViewProvider {
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): Thenable<void> | void {
        webviewView.webview.html = `
<!DOCTYPE html>
<html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Control Panel</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body style="align-content: center">
        <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
        <button>Hallo</button>
    </body>
</html>
`;
    }
}
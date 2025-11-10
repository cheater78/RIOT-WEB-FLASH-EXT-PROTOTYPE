import * as vscode from "vscode";
import {SerialDevice} from "../serial";

export class TerminalProvider implements vscode.WebviewViewProvider {
    constructor(private readonly basePath: vscode.Uri) {}

    private _webviewView?: vscode.WebviewView;

    private _device?: SerialDevice;

    postMessage(message: object): Thenable<boolean> {
        if (this._webviewView !== undefined) {
            return this._webviewView.webview.postMessage(message);
        }
        return new Promise(() => false);
    }

    setDevice(device?: SerialDevice) {
        this._device = device;
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): Thenable<void> | void {
        const cssSrc = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.basePath, 'resources', 'css', 'terminal.css'));
        webviewView.webview.options = {
            enableScripts: true,
        };
        this._webviewView = webviewView;

        webviewView.webview.onDidReceiveMessage(
            message => {
                if (this._device === undefined) {
                    return;
                }
                this._device.write(message.value);
            },
        );


        webviewView.webview.html = `
        <!DOCTYPE html>
        <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Terminal</title>
                <link rel="stylesheet" href="${cssSrc}">
            </head>
            <body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
                <div class="inputArea hidden" id="inputArea">
                     <button onclick="sendInput()">Send Input</button>
                     <input type="text" placeholder="Input" id="input"/>
                </div>
                <br/>
                <textarea class="hidden" id="terminal" readonly></textarea>
            </body>
            <script>
                const vscode = acquireVsCodeApi();
                const terminal = document.getElementById('terminal')
                const input = document.getElementById('input')
                const inputArea = document.getElementById('inputArea')
                window.addEventListener("message", (event) => {
                    switch (event.data.action) {
                        case "hideTerminal":
                            terminal.className = "inputArea hidden";
                            inputArea.className = "hidden"
                            break;
                        case "showTerminal":
                            terminal.className = "";
                            inputArea.className = "inputArea"
                            break;
                        case "clearTerminal":
                            terminal.value = ''
                            input.value = ''
                            break;
                        case "message":
                            terminal.value += event.data.message
                            break;
                    }
                })
                function sendInput() {
                    vscode.postMessage({
                        value: input.value
                    })
                }
            </script>
        </html>
        `;
    }
}
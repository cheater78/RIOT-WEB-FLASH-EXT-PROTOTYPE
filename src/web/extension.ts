import * as vscode from 'vscode';
import {ControlPanelProvider} from "./controlPanelProvider";

export function activate(context: vscode.ExtensionContext) {
    if ((navigator as any).serial === undefined) {
        console.log("Navigator Serial not found");
        return;
    }

    console.log('RIOT Web Extension activated');

    context.subscriptions.push(
        vscode.commands.registerCommand('riot-web-extension.serial.register', async () => {
            console.log('RIOT Web Extension is registering new Device...');
            await vscode.commands.executeCommand(
                "workbench.experimental.requestSerialPort"
            );
        })
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("riot-web.controlPanel", new ControlPanelProvider(context.extensionUri))
    );
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("riot-web", new ControlPanelProvider(context.extensionUri))
    );
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('RIOT Web Extension deactivated');
}

import * as vscode from 'vscode';
import {DevicesProvider, type SerialDevice} from "./providers/devicesProvider";
import {TerminalProvider} from "./providers/terminalProvider";

export function activate(context: vscode.ExtensionContext) {
    if ((navigator as any).serial === undefined) {
        console.log("Navigator Serial not found");
        return;
    }

    console.log('RIOT Web Extension activated');

    const devicesProvider = new DevicesProvider();

    const terminalProvider = new TerminalProvider(context.extensionUri);

    navigator.serial.addEventListener('connect', () => devicesProvider.refresh());
    navigator.serial.addEventListener('disconnect', () => devicesProvider.refresh());


    //Commands
    context.subscriptions.push(vscode.commands.registerCommand('riot-web.serial.register', async () => {
            console.log('RIOT Web Extension is registering new Device...');
            const serialPortInfo: SerialPortInfo = await vscode.commands.executeCommand(
                "workbench.experimental.requestSerialPort"
            );
            if (serialPortInfo) {
                vscode.window.showInformationMessage(`New Serial Device connected!\nUSBVendorID: ${serialPortInfo.usbVendorId}\nUSBProductID: ${serialPortInfo.usbProductId}`, {modal: true});
                devicesProvider.refresh();
            } else {
                vscode.window.showErrorMessage('No new Serial Device selected!', {modal: true});
            }
        })
    );

    context.subscriptions.push(vscode.commands.registerCommand('riot-web.serial.remove', (serialDevice: SerialDevice) => {
        console.log('RIOT Web Extension is removing Device...');
        serialDevice.port.close();
        serialDevice.port.forget();
        devicesProvider.refresh();
    }));

    context.subscriptions.push(
        vscode.commands.registerCommand('riot-web.serial.openTerminal', () => {
            vscode.window.createTerminal('Hallo');
            // vscode.commands.executeCommand('riot-web.serial.terminal.focus');
            // terminalProvider.postMessage({message:"Haosda"});
        })
    );

    //Views

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider("riot-web.serial.devices", devicesProvider)
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("riot-web.serial.terminal", terminalProvider, {webviewOptions: {retainContextWhenHidden: true}})
    );
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('RIOT Web Extension deactivated');
}

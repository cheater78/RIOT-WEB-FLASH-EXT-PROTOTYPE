import * as vscode from 'vscode';
import {DeviceManager} from "./device/deviceManager";
import {DeviceListProvider, type DeviceListItem} from "./device/deviceListProvider";
import {TerminalProvider} from "./providers/terminalProvider";

export function activate(context: vscode.ExtensionContext) {
    console.log('RIOT Web Extension activating...');
    if ((navigator as any).serial === undefined) {
        console.log("Navigator Serial not found");
        return;
    }

    const deviceManager = new DeviceManager();
    const devicesProvider = new DeviceListProvider(deviceManager);

    const terminalProvider = new TerminalProvider(context.extensionUri);

    //Commands
    context.subscriptions.push(vscode.commands.registerCommand('riot-web.serial.register', async () => {
            console.log('RIOT Web Extension is registering new Device...');
            deviceManager.registerDevice(deviceManager.getSupportedDevices()[0]); //TODO: horrible hardcode
        })
    );

    context.subscriptions.push(vscode.commands.registerCommand('riot-web.serial.remove', (deviceListItem: DeviceListItem) => {
        console.log('RIOT Web Extension is removing Device...');
        deviceManager.removeDeviceByUUID(deviceListItem.uuid);
    }));

    context.subscriptions.push(
        vscode.commands.registerCommand('riot-web.serial.openTerminal', () => {
//             vscode.window.createTerminal({
//                 name: 'Hallo',
//                 pty: new class implements vscode.Pseudoterminal {
//                     onDidWrite: vscode.Event<string> = () => {return new vscode.EventEmitter();};
//                     onDidOverrideDimensions?: vscode.Event<vscode.TerminalDimensions | undefined> | undefined;
//                     onDidClose?: vscode.Event<number | void> | undefined;
//                     onDidChangeName?: vscode.Event<string> | undefined;
//                     open(initialDimensions: vscode.TerminalDimensions | undefined): void {
//                         throw new Error("Method not implemented.");
//                     }
//                     close(): void {
//                         throw new Error("Method not implemented.");
//                     }
//                     handleInput?(data: string): void {
//                         throw new Error("Method not implemented.");
//                     }
//                     setDimensions?(dimensions: vscode.TerminalDimensions): void {
//                         throw new Error("Method not implemented.");
//                     }
// }
//             });
            vscode.commands.executeCommand('riot-web.serial.terminal.focus');
            terminalProvider.postMessage({message:"Haosda"});
        })
    );

    //Views

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider("riot-web.serial.devices", devicesProvider)
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("riot-web.serial.terminal", terminalProvider, {webviewOptions: {retainContextWhenHidden: true}})
    );

    console.log('ende');
    console.log('RIOT Web Extension activated');
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('RIOT Web Extension deactivated');
}

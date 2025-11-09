import * as vscode from "vscode";

export class DevicesProvider implements vscode.TreeDataProvider<SerialDevice> {
    getTreeItem(element: vscode.TreeItem | Thenable<vscode.TreeItem>) {
        return element;
    }

    getChildren(element?: any): vscode.ProviderResult<any[]> {
        return navigator.serial.getPorts().then((ports) => {
            let treeItems: SerialDevice[] = [];
            for (const port of ports) {
                treeItems.push(
                    new SerialDevice('Device: ' + port.getInfo().usbVendorId + '|' + port.getInfo().usbProductId, vscode.TreeItemCollapsibleState.None, port)
                );
            }
            return Promise.resolve(treeItems);
        });
    }

    private _onDidChangeTreeData: vscode.EventEmitter<SerialDevice | undefined> = new vscode.EventEmitter<SerialDevice | undefined>();

    readonly onDidChangeTreeData: vscode.Event<SerialDevice | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }
}

export class SerialDevice extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly port: SerialPort
    ) {
        super(label, collapsibleState);
    }
}
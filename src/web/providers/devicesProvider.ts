import * as vscode from "vscode";
import {Device} from "../devices/device";

export class DevicesProvider implements vscode.TreeDataProvider<Device> {
    private _devices?: Device[];

    getTreeItem(element: vscode.TreeItem | Thenable<vscode.TreeItem>) {
        return element;
    }

    getChildren(element?: Device): vscode.ProviderResult<any[]> {
        if (element) {
            return element.getDescription().map<DeviceDescription>((label) => new DeviceDescription(label));
        } else {
            return Promise.resolve(this._devices);
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<Device | undefined> = new vscode.EventEmitter<Device | undefined>();

    readonly onDidChangeTreeData: vscode.Event<Device | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    setDevices(devices: Device[]): void {
        this._devices = devices;
    }
}

class DeviceDescription extends vscode.TreeItem {

    constructor(
        public readonly label: string,
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'description';
    }

}
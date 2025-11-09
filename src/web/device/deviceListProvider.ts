import * as vscode from "vscode";
import { DeviceManager } from "./deviceManager";

export class DeviceListItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly uuid: string,
    ) {
        super(label);
    }
}

export class DeviceListProvider implements vscode.TreeDataProvider<DeviceListItem> {
    constructor(private deviceManager: DeviceManager) {
        this.deviceManager.registerOnDeviceChangeCallback(this.refresh);
    }
    
    getTreeItem(element: vscode.TreeItem | Thenable<vscode.TreeItem>) {
        return element;
    }

    getChildren(element?: any): vscode.ProviderResult<any[]> {
        if (element) {
            return Promise.resolve([]);
        }
        
        const devices = this.deviceManager.getDevices();
        let treeItems: DeviceListItem[] = [];

        for (const device of devices) {
            treeItems.push(
                new DeviceListItem(device.displayName, device.uuid)
            );
        }

        return Promise.resolve(treeItems);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<DeviceListItem | undefined> = new vscode.EventEmitter<DeviceListItem | undefined>();

    readonly onDidChangeTreeData: vscode.Event<DeviceListItem | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }
}


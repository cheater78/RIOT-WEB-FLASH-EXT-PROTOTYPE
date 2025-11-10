import * as vscode from "vscode";
import {SerialDevice} from "../serial";

export class DevicesProvider implements vscode.TreeDataProvider<SerialDevice> {
    private _devices?: SerialDevice[];

    getTreeItem(element: vscode.TreeItem | Thenable<vscode.TreeItem>) {
        return element;
    }

    getChildren(element?: any): vscode.ProviderResult<any[]> {
        if (element || !this._devices) {
            return;
        }
        let result: vscode.TreeItem[] = [];
        for (let i = 0; i < this._devices.length; i++) {
            result.push(new SerialTreeItem(this._devices[i].label, this._devices[i].contextValue, i));
        }
        return Promise.resolve(result);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<SerialDevice | undefined> = new vscode.EventEmitter<SerialDevice | undefined>();

    readonly onDidChangeTreeData: vscode.Event<SerialDevice | undefined> = this._onDidChangeTreeData.event;

    refresh(devices: SerialDevice[]): void {
        this._devices = devices;
        this._onDidChangeTreeData.fire(undefined);
    }
}

export class SerialTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly contextValue: string,
        public readonly index: number,
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
    }
}
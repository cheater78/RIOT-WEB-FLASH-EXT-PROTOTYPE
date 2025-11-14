import * as vscode from "vscode";
import {Device} from "../devices/device";

export class DevicesProvider implements vscode.TreeDataProvider<Device> {
    private _devices?: Device[];

    getTreeItem(element: vscode.TreeItem | Thenable<vscode.TreeItem>) {
        return element;
    }

    getChildren(element?: any): vscode.ProviderResult<any[]> {
        if (element || !this._devices) {
            return;
        } else {
            return Promise.resolve(this._devices);
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<Device | undefined> = new vscode.EventEmitter<Device | undefined>();

    readonly onDidChangeTreeData: vscode.Event<Device | undefined> = this._onDidChangeTreeData.event;

    refresh(devices: Device[]): void {
        this._devices = devices;
        this._onDidChangeTreeData.fire(undefined);
    }
}
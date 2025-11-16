import * as vscode from "vscode";
import {Device} from "../devices/device";

export class TerminalProvider implements vscode.WebviewViewProvider, RiotTerminal {
    constructor(private readonly basePath: vscode.Uri) {}

    private _webviewView?: vscode.WebviewView;

    private _devices: Device[] = [];

    private _webviewState: {devices: {uuid: string, label: string, terminalState: RiotTerminalState, terminalData: string, inputData: string}[], selectedTab?: string} = {
        devices: [],
        selectedTab: '',
    };

    addDevice(device: Device, terminalState: RiotTerminalState) {
        const index = this._devices.indexOf(device);
        if (index === -1) {
            this._devices.push(device);
            this._webviewView?.webview.postMessage({
                action: 'addDevice',
                uuid: device.contextValue,
                label: device.label,
                terminalState: terminalState,
                terminalData: "",
                inputData: ""
            });
            this._webviewState.devices.push({
                uuid: device.contextValue,
                label: device.label as string,
                terminalState: terminalState,
                terminalData: "",
                inputData: ""
            });
        } else {
            //replace flash terminal
            //TODO
        }
    }

    removeDevice(device: Device) {
        const index = this._devices.indexOf(device);
        if (index !== -1) {
            this._devices.splice(index, 1);
            this._webviewView?.webview.postMessage({
                action: 'removeDevice',
                uuid: device.contextValue,
            });
            for (let i = 0; i < this._webviewState.devices.length; i++) {
                if (this._webviewState.devices[i].uuid === device.contextValue) {
                    this._webviewState.devices.splice(i, 1);
                    break;
                }
            }
            if (device.contextValue === this._webviewState.selectedTab) {
                if (this._devices.length === 0) {
                    this._webviewState.selectedTab = undefined;
                } else {
                    this._webviewState.selectedTab = this._devices[0].contextValue;
                }
            }
        }
    }

    postMessage(uuid: string, message: string) {
        if (this._webviewView !== undefined) {
            this._webviewView.webview.postMessage({
                action: 'message',
                uuid: uuid,
                message: message
            });
            for (const device of this._webviewState.devices) {
                if (device.uuid === this._webviewState.selectedTab) {
                    device.terminalData += message;
                }
            }
        }
    }

    clearTerminal() {
        if (this._webviewView !== undefined) {
            this._webviewView.webview.postMessage({
                action: 'clearTerminal'
            });
            for (const device of this._webviewState.devices) {
                if (device.uuid === this._webviewState.selectedTab) {
                    device.terminalData = '';
                }
            }
        }
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): Thenable<void> | void {
        const css = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.basePath, 'resources', 'css', 'terminal.css'));
        webviewView.webview.options = {
            enableScripts: true,
        };
        this._webviewView = webviewView;
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.action) {
                    case 'selectTab':
                        this._webviewState.selectedTab = message.tab;
                        break;
                    case 'message': {
                        for (const device of this._devices) {
                            if (device.contextValue === message.uuid) {
                                device.write(message.message);
                                break;
                            }
                        }
                        break;
                    }
                }
            },
        );
        webviewView.webview.html = getHTML(css, JSON.stringify(this._webviewState));
    }
}

export enum RiotTerminalState {
    COMMUNICATION = "communication",
    FLASH = "flash"
}

export interface RiotTerminal {
    postMessage(uuid: string, message: string): void;
    clearTerminal(): void;
}

function getHTML(css: vscode.Uri, webviewState: string) {
    return (
`
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Riot Terminal</title>
        <link rel="stylesheet" href="${css}">
    </head>
    <body data-vscode-context='{"preventDefaultContextMenuItems": true}' class="none">
        <div id="tabContent">
            <div class="inputArea">
                <button class="submitButton" onclick="sendInput()">Submit</button>
                <input type="text" placeholder="Input" id="input" oninput="updateInput()"/>
            </div>
            <textarea id="terminal" readonly></textarea>
        </div>
        <div id="tabs" class="tabs"></div>
        <p class="noSelection">No Device open</p>
    </body>
    <script>
        const vscode = acquireVsCodeApi();
        const tabs = document.getElementById("tabs");
        const tabContent = document.getElementById("tabContent");
        const terminal = document.getElementById("terminal");
        const input = document.getElementById("input");
        const currentState = ${webviewState}
        if (currentState.devices.length !== 0) initialize();
        window.addEventListener("message", (event) => {
            switch (event.data.action) {
                case "clearTerminal":
                    for (const device of currentState.devices) {
                        if (device.uuid === currentState.selectedTab) {
                            device.terminalData = '';
                            break;
                        }
                        terminal.value = ''
                    }
                    break;
                case "message":
                    for (const device of currentState.devices) {
                        if (device.uuid === event.data.uuid) {
                            device.terminalData += event.data.message
                            break;
                        }
                    }
                    if (currentState.selectedTab === event.data.uuid) {
                        const scrollDown = terminal.scrollTop === (terminal.scrollHeight - terminal.clientHeight)
                        terminal.value += event.data.message
                        if (scrollDown) {
                            terminal.scrollTop = terminal.scrollHeight;
                        }
                    }
                    break;
                case "addDevice":
                    if (currentState.devices.length === 0) document.body.className = "shown";
                    currentState.devices.push({
                        uuid: event.data.uuid,
                        label: event.data.label,
                        terminalState: event.data.terminalState,
                        terminalData: event.data.terminalData,
                        inputData: event.data.inputData,
                    })
                    if (currentState.selectedTab) document.getElementById(currentState.selectedTab).className = "tab"
                    createTab(event.data.uuid, event.data.label, true);
                    tabContent.className = event.data.terminalState
                    break;
                case "removeDevice":
                    for (let i = 0; i < currentState.devices.length; i++) {
                        if (currentState.devices[i].uuid === event.data.uuid) {
                            currentState.devices.splice(i, 1)
                            if (currentState.selectedTab === event.data.uuid) {
                                if (currentState.devices.length === 0) {
                                    currentState.selectedTab = '';
                                } else {
                                    selectTab(currentState.devices[0])
                                }
                                document.getElementById(event.data.uuid).remove()
                            }
                            break;
                        }
                    }
                    if (currentState.devices.length === 0) {
                        document.body.className = "none"
                    }
                    console.log(currentState);
                    break;
            }
        })
        
        function initialize() {
            document.body.className = "shown"
            let j = undefined;
            for (let i = 0; i < currentState.devices.length; i++) {
                const selected = currentState.devices[i].uuid === currentState.selectedTab;
                createTab(currentState.devices[i].uuid, currentState.devices[i].label, selected)
                if (selected) j = i;
            }
            if (j) {
                terminal.value = currentState.devices[j].terminalData;
                input.value = currentState.devices[j].inputData;
                tabContent.className = currentState.devices[j].terminalState
            }
        }
        
        function createTab(uuid, label, setFocus) {
            const tab = document.createElement("button");
            tab.className = "tab" + (setFocus ? " selected" : "")
            tab.id = uuid
            tab.innerText = label
            tab.onclick = () => selectTab(tab)
            if (setFocus) {
                currentState.selectedTab = tab.id;
                vscode.postMessage({
                    action: "selectTab",
                    tab: tab.id
                })
            }
            tabs.appendChild(tab);
        }
        
        function selectTab(tab) {
            if (currentState.selectedTab === tab.id) return;
            document.getElementById(currentState.selectedTab).className = "tab"
            tab.className = "tab selected"
            currentState.selectedTab = tab.id;
            vscode.postMessage({
                action: "selectTab",
                tab: tab.id
            })
            for (const device of currentState.devices) {
                if (device.uuid === tab.id) {
                    terminal.value = device.terminalData;
                    input.value = device.inputData;
                    tabContent.className = device.terminalState
                    break;
                }
            }
        }
        
        function updateInput() {
            for (const device of currentState.devices) {
                if (device.uuid === currentState.selectedTab) {
                    device.inputData = input.value
                    break;
                }
            }
        }
        
        function sendInput() {
            let uuid = undefined;
            let message = '';
            for (const device of currentState.devices) {
                if (device.uuid === currentState.selectedTab) {
                    uuid = device.uuid;
                    message = device.inputData;
                    break;
                }
            }
            if (!uuid) return;
            vscode.postMessage({
                action: 'message',
                uuid: uuid,
                message: message,
            })
        }
    </script>
</html>
`);
}
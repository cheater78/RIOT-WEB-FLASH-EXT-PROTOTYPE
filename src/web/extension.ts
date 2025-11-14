import vscode from "vscode";
import {type FlashOptions, type LoaderOptions} from "esptool-js";
import {FileProvider} from "./providers/fileProvider";
import {DevicesProvider} from "./providers/devicesProvider";
import {Device} from "./devices/device";
import {SerialDevice} from "./devices/serialDevice";
import {DeviceManager} from "./devices/deviceManager";
import {TerminalProvider, RiotTerminalState} from "./providers/terminalProvider";

export function activate(context: vscode.ExtensionContext) {
    if ((navigator as any).serial === undefined) {
        console.log("Navigator Serial not found");
        return;
    }
    console.log('RIOT Web Extension activated');

    const devicesProvider = new DevicesProvider();
    const terminalProvider = new TerminalProvider(context.extensionUri);
    const fileProvider = new FileProvider();
    const deviceManager = new DeviceManager(devicesProvider);
    navigator.serial.addEventListener('connect', (event) => {
        deviceManager.handleConnectEvent(event.target as SerialPort);
    });
    navigator.serial.addEventListener('disconnect', (event) => {
        deviceManager.handleDisconnectEvent(event.target as SerialPort);
    });
    vscode.commands.executeCommand('setContext', 'riot-web.openDevice', 'none');

    //Commands
    context.subscriptions.push(
        //add new Device
        vscode.commands.registerCommand('riot-web.serial.register', async () => {
            console.log('RIOT Web Extension is registering new Device...');
            const serialPortInfo: SerialPortInfo = await vscode.commands.executeCommand(
                "workbench.experimental.requestSerialPort"
            );
            if (serialPortInfo) {
                vscode.window.showInformationMessage(`New Serial Device connected!\nUSBVendorID: ${serialPortInfo.usbVendorId}\nUSBProductID: ${serialPortInfo.usbProductId}`);
                deviceManager.checkForAddedDevice();
            } else {
                vscode.window.showErrorMessage('No new Serial Device selected!');
            }
        }),
        //remove Device
        vscode.commands.registerCommand('riot-web.serial.remove', (device: Device) => {
            console.log('RIOT Web Extension is removing Device...');
            deviceManager.removeDevice(device);
        }),
        //clear Terminal
        vscode.commands.registerCommand('riot-web.serial.clearTerminal', () => {
            terminalProvider.clearTerminal();
        }),
        //open Terminal for Communication
        vscode.commands.registerCommand('riot-web.serial.openCommunicationTerminal', async (device: Device) => {
            if (!(device instanceof SerialDevice)) {
                return;
            }
            await device.open({
                baudRate: 115200
            });
            terminalProvider.setDevice(device);
            terminalProvider.setTerminalState(RiotTerminalState.COMMUNICATION);
            vscode.commands.executeCommand('riot-web.serial.terminal.focus');
            device.read(terminalProvider);
        }),
        //close Terminal
        vscode.commands.registerCommand('riot-web.serial.closeTerminal', async (device: Device) => {
            await device.close();
            terminalProvider.setDevice();
            terminalProvider.setTerminalState(RiotTerminalState.NONE);
        }),
        //flash Device
        vscode.commands.registerCommand('riot-web.serial.flash', async (device: Device) => {
            if (!(device instanceof SerialDevice)) {
                return;
            }
            terminalProvider.setTerminalState(RiotTerminalState.FLASH);
            vscode.commands.executeCommand('riot-web.serial.terminal.focus');
            const json = await fileProvider.loadJson(vscode.Uri.joinPath(context.extensionUri, 'flash', 'flasherArgs.json')) as FlasherArgsJson;
            const loaderOptions: LoaderOptions = {
                transport: device.getTransport(),
                baudrate: json.baud_rate,
                terminal: {
                    clean() {
                        terminalProvider.clearTerminal();
                    },
                    write(data: string) {
                        terminalProvider.postMessage(data);
                    },
                    writeLine(data: string) {
                        terminalProvider.postMessage(data + '\n');
                    }
                },
                debugLogging: true
            } as LoaderOptions;

            // process binary data to flash
            let file_array: { address: number; data: string }[] = [];
            for (const [key, value] of Object.entries(json.data)) {
                console.log(key, value);
                const address: number = parseInt(key, 16);
                if(isNaN(address)) {
                    throw new Error(`importFlasherArgs: Invalid address for file ${key}!`);
                }
                const data: string = await fileProvider.loadBinary(vscode.Uri.joinPath(context.extensionUri, 'flash', value));
                file_array.push({ address, data });
            }

            // determine flash size
            let flashSize = json.flash_size;
            if(flashSize === "detect") {
                flashSize = "keep";
            }

            const flashOptions = {
                fileArray: file_array,
                flashSize: flashSize,
                flashMode: json.flash_mode,
                flashFreq: json.flash_freq,
                compress: json.compress,
                eraseAll: json.erase_all
            } as FlashOptions;
            await device.flash({
                loaderOptions: loaderOptions,
                flashOptions: flashOptions
            });
        })
    );

    //Views
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("riot-web.serial.terminal", terminalProvider, {webviewOptions: {retainContextWhenHidden: true}}),
        vscode.window.registerTreeDataProvider("riot-web.serial.devices", devicesProvider)
    );


}


export function deactivate() {
    console.log('RIOT Web Extension deactivated');
}

type FlasherArgsJson = {
    baud_rate: number;
    flash_size: string;
    flash_mode: string;
    flash_freq: string;
    compress: boolean;
    erase_all: boolean;
    data: Record<string, string>;
}

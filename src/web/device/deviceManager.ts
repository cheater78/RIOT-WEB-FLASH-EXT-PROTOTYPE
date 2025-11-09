
import * as vscode from "vscode";
import {
    DeviceInterfaceType,
    DeviceFamily,
    SupportedDevice,
    PhysicalDevice,
    PhysicalSerialDevice,
    PhysicalUSBDevice
} from "./device";
import { ESPDevice } from "./esp/deviceESP";

export class DeviceManager {
    // List of supported devices (hardcoded for now, TODO: maybe import from RIOT, but also support must be done manually so..?)
    supportedDevices: SupportedDevice[] = [
        new SupportedDevice("esp32-wroom-32", DeviceInterfaceType.SERIAL, DeviceFamily.ESP),
    ];
    // Currently connected devices, that are permitted by the user
    devices: PhysicalDevice[];
    // Devices that were disconnected but might reconnect (are permitted by the user)
    dormantDevices: PhysicalDevice[] = [];
    deviceChangedCallbacks: (()=>void)[];

    constructor() {
        this.devices = [];
        this.deviceChangedCallbacks = [];
        
        // Listen for Serial device connect/disconnect events
        navigator.serial.addEventListener('connect', this.refreshDevices);
        navigator.serial.addEventListener('disconnect', this.refreshDevices);

        //TODO: Listen for USB device connect/disconnect events
    }

    getSupportedDevices(): SupportedDevice[] {
        return this.supportedDevices;
    }
    
    // Note: Adding a device is done though workbench.experimental.requestSerialPort, none other!
    async registerDevice(supportedDevice: SupportedDevice): Promise<void> {
        if (supportedDevice.interfaceType === DeviceInterfaceType.SERIAL) {
            // Helper function to find a SerialPort given its info, TODO: info possibly NOT unique
            const getSerialPort = async (portInfo: SerialPortInfo): Promise<SerialPort | undefined> => {
                return await navigator.serial.getPorts().then(
                    (ports) => {
                        for(const port of ports){
                            const pInfo = port.getInfo();
                            if(pInfo.usbVendorId === portInfo.usbVendorId &&
                                pInfo.usbProductId === portInfo.usbProductId) {
                                    return port;
                            }
                        }
                        return undefined;
                    }
                ).catch(() => {
                    vscode.window.showErrorMessage("No Serial Ports found!");
                    return undefined;
                });
            };

            console.log('RIOT Web Extension is registering new Device...');
            const serialPortInfo: SerialPortInfo = await vscode.commands.executeCommand("workbench.experimental.requestSerialPort");
            if (serialPortInfo === undefined || serialPortInfo === null) {
                vscode.window.showErrorMessage('No Serial Device selected!');
                return;
            }
            if (supportedDevice.family === DeviceFamily.ESP) {
                const port = await getSerialPort(serialPortInfo);
                if(port === undefined || port === null) {
                    vscode.window.showErrorMessage(`SerialPort with Info: ${serialPortInfo} was not found!`);
                    return;
                }
                const device = new ESPDevice(
                    crypto.randomUUID(),
                    `ESP Device(${serialPortInfo.usbVendorId}|${serialPortInfo.usbProductId})`,
                    port
                );
                this.devices.push(device);
                this.triggerOnDeviceChangeCallback();
                return;
            }
            //TODO: add future Device Families here
            vscode.window.showErrorMessage('Device family not supported yet!');
            return;
        } else if (supportedDevice.interfaceType === DeviceInterfaceType.USB) {
            vscode.window.showErrorMessage('USB Device registration not supported yet!');
            return;
        }
        //NOTE: add future DeviceInterfaceTypes here
        vscode.window.showErrorMessage('Device type not supported!');
        return;
    }

    removeDevice(device: PhysicalDevice): void {
        const index = this.devices.findIndex(d => d.uuid === device.uuid);
        if (index === -1) {
            vscode.window.showErrorMessage(`Device ${device.displayName} not found.`);
            return;
        }
        this.devices.splice(index, 1);
        vscode.window.showInformationMessage(`Device ${device.displayName} removed.`);
    }
    removeDeviceByUUID(uuid: string) : void {
        const device = this.getDevice(uuid);
        if(device !== undefined) {
            this.removeDevice(device);
        }
    }

    getDevice(uuid: string): PhysicalDevice | undefined {
        return this.devices.find(d => d.uuid === uuid);
    }

    getDevices(): PhysicalDevice[] {
        return this.devices;
    }
    
    refreshDevices(): void {
        // Check for Serial devices
        navigator.serial.getPorts().then(
            (ports) => {
                // Search for newly connected devices - warn, as for actual adding, selection of a SupportedDevice is needed
                for (const port of ports) {
                    // connection just provides a port, so we have to match with that
                    if(!this.devices.find(d => { return (d.getDeviceType() === DeviceInterfaceType.SERIAL) && ((d as PhysicalSerialDevice).port === port); }) &&
                        !this.dormantDevices.find(d => { return (d.getDeviceType() === DeviceInterfaceType.SERIAL) && ((d as PhysicalSerialDevice).port === port); })
                    ) { // New device
                        vscode.window.showWarningMessage(`New serial device allowed but not added. Please register device properly!`);
                    }
                }
                // Search for just reconnected devices
                for (const port of ports) {
                    // connection just provides a port, so we have to match with that
                    const reconnectedDevice = this.dormantDevices.find(d => { return (d.getDeviceType() === DeviceInterfaceType.SERIAL) && ((d as PhysicalSerialDevice).port === port); });
                    if (reconnectedDevice) {
                        this.devices.push(reconnectedDevice);
                        this.dormantDevices = this.dormantDevices.filter(d => d.uuid !== reconnectedDevice.uuid);
                        vscode.window.showInformationMessage(`Device ${reconnectedDevice.displayName} reconnected.`);
                    }
                }
                // Search for disconnected devices
                for(const device of this.devices) {
                    if (device.getDeviceType() === DeviceInterfaceType.SERIAL) {
                        const serialDevice = device as PhysicalSerialDevice;
                        if (!ports.includes(serialDevice.port)) {
                            this.dormantDevices.push(device);
                            this.devices = this.devices.filter(d => d.uuid !== device.uuid);
                            vscode.window.showWarningMessage(`Device ${device.displayName} disconnected.`);
                        }
                    }
                }
            }
        );
        //TODO: Check for USB devices
    }

    registerOnDeviceChangeCallback(callback: () => void): void {
        this.deviceChangedCallbacks.push(callback);
    }

    triggerOnDeviceChangeCallback(): void {
        this.deviceChangedCallbacks.forEach(c => c());
    }
}
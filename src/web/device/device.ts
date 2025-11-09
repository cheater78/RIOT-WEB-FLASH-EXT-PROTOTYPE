
export enum DeviceInterfaceType {
    SERIAL,
    USB,
}

export enum DeviceFamily {
    ESP,
}

export class SupportedDevice {
    constructor(
        public readonly canonicalName: string,
        public readonly interfaceType: DeviceInterfaceType,
        public readonly family: DeviceFamily) {
    }
}

export interface PhysicalDevice {
    uuid: string;
    displayName: string;

    getDeviceType(): DeviceInterfaceType;

    open(): void;
    close(): void;

    flash(): void;
    erase(): void;

    readSerial(): void;
    writeSerial(data: string): void;
}

export interface PhysicalSerialDevice extends PhysicalDevice {
    port: SerialPort;
}

export interface PhysicalUSBDevice extends PhysicalDevice {
    //TODO: USB specific properties
}
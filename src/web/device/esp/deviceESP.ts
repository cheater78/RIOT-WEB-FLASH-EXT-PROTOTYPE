import { Transport } from "esptool-js";
import { DeviceInterfaceType, PhysicalSerialDevice } from "../device";

export class ESPDevice implements PhysicalSerialDevice {
    transport: Transport | null = null;

    constructor(public uuid: string, public displayName: string, public port: SerialPort) {}
    getDeviceType() {
        return DeviceInterfaceType.SERIAL;
    }
    open(): void { /*TODO*/ }
    close(): void { /*TODO*/ }
    flash(): void { /*TODO*/ }
    erase(): void { /*TODO*/ }
    readSerial(): void { /*TODO*/ }
    writeSerial(data: string): void { /*TODO*/ }

}
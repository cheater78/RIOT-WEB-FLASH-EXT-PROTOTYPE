import { LoaderOptions, ESPLoader, FlashOptions, Transport } from 'esptool-js';
import * as vscode from 'vscode';
import { loadBinary } from './binary';



export async function flash(workspaceFolder: vscode.WorkspaceFolder, devicePort: SerialPort) {

        //TODO: DeviceManager -> Device (name, canonicalName(maybe from SupportedDevices with inheritance/ ownership), port)
        const deviceCanonicalName: string = "esp32-wroom-32";

        //TODO: project / workspace handling
        const projectName: string = "hello-world";

        // construct binary folder
        const binaryFolder: vscode.Uri = vscode.Uri.joinPath(workspaceFolder.uri, "bin", deviceCanonicalName);
        
        //TODO: read and parse flasherargs file
        // fetch flasher args and binary
        const baudRate: number = 0;
        const eraseFlash: boolean = false;
        const bootloaderOffset: number = 0x0000;
        const partitionsOffset: number = 0x1000;
        const projectOffset: number = 0x8000;

        // TODO: binaries for esp, but could also get from flasher args?
        const bootloaderBinaryFile: vscode.Uri = vscode.Uri.joinPath(binaryFolder, "esp_bootloader", "bootloader.bin");
        const partitionBinaryFile: vscode.Uri = vscode.Uri.joinPath(binaryFolder, "partitions.bin");
        const projectBinaryFile: vscode.Uri = vscode.Uri.joinPath(binaryFolder, projectName + ".bin");

        const bootloaderBinary: string = await loadBinary(bootloaderBinaryFile);
        const partitionBinary: string = await loadBinary(partitionBinaryFile);
        const projectBinary: string = await loadBinary(projectBinaryFile);

        let binaries: { address: number; data: string }[] = [];
        binaries.push({address: bootloaderOffset, data: bootloaderBinary});
        binaries.push({address: partitionsOffset, data: partitionBinary});
        binaries.push({address: projectOffset, data: projectBinary});

        
        const flashOptions: FlashOptions = {
                //TODO: from parser
                eraseAll: eraseFlash,
                fileArray: binaries
        } as FlashOptions;

        const transport: Transport = new Transport(devicePort);

        const loaderOptions = {
            transport,
            baudrate: baudRate,
            terminal: espLoaderTerminal,
            debugLogging: true,
        } as LoaderOptions;
        
        const espLoader = new ESPLoader(loaderOptions);
        await espLoader.main();

        if(eraseFlash) {
                await espLoader.eraseFlash();
        }
        
        await espLoader.writeFlash(flashOptions);
        await espLoader.after()

        await transport.disconnect();
}
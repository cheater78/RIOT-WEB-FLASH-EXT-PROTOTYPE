
export class CommandRelay {
    private _socket: WebSocket;

    constructor(

    ) {
        const WebSocket = require("ws");
        this._socket = new WebSocket.Server({ port: 8765 });
        
        //TODO

        this._socket.close();
    }

}
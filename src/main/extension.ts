import * as vscode from 'vscode';
import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer;

export function activate(context: vscode.ExtensionContext) {
    const isWeb = vscode.env.uiKind === vscode.UIKind.Web;
    const isNodeHost = !isWeb && typeof process !== 'undefined' && process.release?.name === 'node';

    if (isNodeHost) {
        // Create WebSocket server directly in Node host
        wss = new WebSocketServer({ port: 1337 });
        console.log('WebSocket relay started on port 1337');

        wss.on('connection', (ws: WebSocket) => {
            console.log('Client connected');

            ws.on('message', (message: string) => {
                console.log('Received:', message);

                // Broadcast to all clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(message.toString());
                    }
                });
            });
        });
    }
}

export function deactivate() {
    if (wss) {
        wss.close();
        console.log('WebSocket relay stopped');
    }
}
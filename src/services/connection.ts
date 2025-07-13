import type { WebSocket, WebSocketServer } from "ws";
import { users } from "../storage/chatStorage";
import {
    parseClientMessage,
    messageHandlers,
    sendingMessage
} from "./handlers";

export function clientConnection(ws: WebSocket, wss: WebSocketServer) {
    console.log("✅ Новый клиент подключился");

    ws.on("message", (raw) => {
        const parsed = parseClientMessage(raw, ws);
        
        if (!parsed) {
            return
        };

        const handler = messageHandlers[parsed.type];

        if (handler) {
            handler(ws, wss, parsed);
        } else {
            sendingMessage(ws, { type: "error", message: "Unknown message type" });
        }
    });

    ws.on("close", () => {
        const username = users.get(ws);
        
        users.delete(ws);
        
        console.log(`${username} disconnected`);
    });

    ws.on("error", (err) => {
        console.error("Error:", err);
    });
}
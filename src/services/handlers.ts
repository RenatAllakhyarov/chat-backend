// src/ws/handlers.ts
import { RawData, WebSocket, WebSocketServer } from "ws";
import { users, messages } from "../storage/chatStorage";
import { ClientMessage, ServerMessages } from "../types/meta";

export function sendingMessage(ws: WebSocket, msg: ServerMessages) {
    ws.send(JSON.stringify(msg));
}

export function parseClientMessage(raw: RawData, ws: WebSocket): ClientMessage | undefined {
    try {
        return JSON.parse(raw.toString()) as ClientMessage;
    } catch {
        sendingMessage(ws, { type: "error", message: "Incorrect JSON" });

        return undefined;
    }
}

export function handleInit(ws: WebSocket, _wss: WebSocketServer,parsed: ClientMessage) {

    if (parsed.type !== "init") {
        return;
    }

    if (!parsed.username) {
        sendingMessage(ws, {
            type: "error",
            message: "Write your nickname",
        });

        return;
    }

    users.set(ws, parsed.username);

    console.log(`${parsed.username} is joined to chat`);

    sendingMessage(ws, { type: "history", messages });
}

export function handleMsg(ws: WebSocket, wss: WebSocketServer, parsed: ClientMessage) {

    if (parsed.type !== "msg") {
        return;
    }

    if (typeof parsed.text !== "string") return;

    const username = users.get(ws);
    
    if (!username) return;

    const message = {
        username,
        text: parsed.text,
        timestamp: new Date().toLocaleString("ru-RU"),
    };

    messages.push(message);

    console.log(`${username}: ${parsed.text} at [${message.timestamp}]`);

    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            sendingMessage(client, { type: "msg", ...message });
        }
    }
}

export const messageHandlers: Record<string, (ws: WebSocket, wss: WebSocketServer, parsed: ClientMessage) => void> = {
    init: handleInit,
    msg: handleMsg,
};

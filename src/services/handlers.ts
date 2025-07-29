// src/ws/handlers.ts
import { RawData, WebSocket, WebSocketServer } from "ws";
import { userConnections, chatMessages } from "../storage/chatStorage";
import { ClientMessage, ServerMessages } from "../types/meta";
import {User} from '../models/User';
import {Message} from '../models/Message';
import { text } from "stream/consumers";

export function sendingMessage(ws: WebSocket, msg: ServerMessages) {
    console.log("Отправка сообщения клиенту:", msg)
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

export async function handleInit(ws: WebSocket, _wss: WebSocketServer,parsed: ClientMessage) {

    if (parsed.type !== "init") {
        console.log("handleInit: неверный тип сообщения")
        return;
    }

    if (!parsed.username) {
        sendingMessage(ws, {
            type: "error",
            message: "Write your nickname",
        });

        return;
    }

    userConnections.set(ws, parsed.username);

    let user = await User.findOne({username: parsed.username});
    if (!user) {
        user = new User({username: parsed.username});
        await user.save();
        console.log(`New use has been saved: ${parsed.username}`);
    }else {
        console.log(`User has been found: ${parsed.username}`)
    }

    const dbMessages = await Message.find().sort({timestamp: -1}).limit(50);
    console.log(`The number of downloaded messages: ${dbMessages.length}`)
    const wsMessages = dbMessages.map(dbMsg => ({
        id: Math.random(),
        username: dbMsg.sender,
        text: dbMsg.text,
        timestamp: dbMsg.timestamp.toLocaleString("ru-RU")
    }));

    sendingMessage(ws, {type:"history", messages: wsMessages});
    console.log(`${parsed.username} is joined to chat`);
    console.log("USERS: ", userConnections);
}

export async function handleMsg(ws: WebSocket, wss: WebSocketServer, parsed: ClientMessage) {

    if (parsed.type !== "msg") {
        return;
    }

    if (typeof parsed.text !== "string") return;

    const username = userConnections.get(ws);
    console.log("SENDER USERNAME: ", username);

    if (!username) return;

    const message = {
        id: Math.random(),
        username,
        text: parsed.text,
        timestamp: new Date().toLocaleString("ru-RU"),
    };
    
    const dbMessage = new Message({
        sender: username,
        text: parsed.text,
        timestamp: new Date()
    });
    await dbMessage.save();

    console.log("MESSAGES: ", chatMessages);

    console.log(`${username}: ${parsed.text} at [${message.timestamp}]`);



    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            sendingMessage(client, { type: "msg", ...message });
        }
    }
}

export const messageHandlers: Record<string, (ws: WebSocket, wss: WebSocketServer, parsed: ClientMessage) =>Promise<void>> = {
    init: handleInit,
    msg: handleMsg,
};

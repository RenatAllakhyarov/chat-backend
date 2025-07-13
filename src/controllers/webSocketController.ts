import { WebSocket, WebSocketServer } from "ws";
import { users, messages } from "../storage/chatStorage";
import { ClientMessage, ServerMessages } from "../types/meta";

function sendingMessage(ws: WebSocket, msg: ServerMessages) {
    ws.send(JSON.stringify(msg));
}

export function clientConnection(ws: WebSocket, wss: WebSocketServer) {
    console.log("✅ Новый клиент подключился");

    ws.on("message", (raw) => {
        let parsed: ClientMessage;

        try {
            parsed = JSON.parse(raw.toString());
        } catch {
            sendingMessage(ws, { type: "error", message: "Incorrect JSON" });

            return;
        }

        switch (parsed.type) {
            case "init":
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

                break;

            case "msg":
                if (typeof parsed.text !== "string") {
                    return;
                }

                const username = users.get(ws);

                if (!username) {
                    return;
                }

                const message = {
                    username,
                    text: parsed.text,
                    timestamp: Date.now().toLocaleString("ru-RU"),
                };

                messages.push(message);

                console.log(
                    `${username}: ${parsed.text} at [${message.timestamp}]`
                );

                for (const client of wss.clients) {
                    if (client.readyState === WebSocket.OPEN) {
                        sendingMessage(client, { type: "msg", ...message });
                    }
                }

                break;
        }
    });

    ws.on("close", () => {
        const username = users.get(ws);

        users.delete(ws);

        console.log(`${username} disconnected`);
    });

    ws.on("error", (err) => {
        console.log("Error,", err);
    });
}

import type { WebSocket, WebSocketServer } from "ws";
import { userConnections } from "../storage/chatStorage";
import {
    parseClientMessage,
    messageHandlers,
    sendingMessage
} from "./handlers";

class ClientConnectionService {
    public static clientConnection(ws: WebSocket, wss: WebSocketServer) {
        console.log("✅ Новый клиент подключился");
    
        ws.on("message", async (raw) => {
            console.log("Получено сообщение от клиента");
            const parsed = parseClientMessage(raw, ws);
            console.log("Результат парсинга сообщения:", parsed)
            if (!parsed) {
                console.warn("Не удалось распарсить сообщение");
                return
            };
    
            const handler = messageHandlers[parsed.type];
            console.log("Тип сообщения:", parsed.type)
            if (handler) {
                console.log(`Вызван обработчик для типа: ${parsed.type}`)
                await handler(ws, wss, parsed);
            } else {
                console.warn("Неизвестный тип сообщения:", parsed.type)
                sendingMessage(ws, { type: "error", message: "Unknown message type" });
            }
        });
    
        ws.on("close", () => {
            const username = userConnections.get(ws);
            
            userConnections.delete(ws);
            console.log(`${username} disconnected`);
        });
    
        ws.on("error", (err) => {
            console.error("Error:", err);
        });
    };
};

export default ClientConnectionService;

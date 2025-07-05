import express, { type Request, type Response } from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3001;

const users = new Map();

type Message = {
    username: string;
    text: string;
    timestamp: number;
};
const messages: Message[] = [];

wss.on("connection", (ws) => {
    console.log("✅ Новый клиент подключился");

    ws.once("message", (data) => {
        let parsed;

        try {
            parsed = JSON.parse(data.toString());
        } catch (err) {
            ws.send(
                JSON.stringify({ type: "error", message: "НЕ ВЕРНЫЙ JSON" })
            );
            ws.close();
        }

        if (parsed.type !== "init" || !parsed.username) {
            ws.send(
                JSON.stringify({
                    type: "error",
                    message: "Введи по-братски имя свое",
                })
            );
            ws.close();
            return;
        }

        const username = parsed.username;

        users.set(ws, username);

        console.log(`${username} зашел в чат`);

        ws.send(JSON.stringify({ type: "history", messages }));

        ws.on("message", (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw.toString());
            } catch {
                return;
            }

            if (msg.type === "msg" && typeof msg.text === "string") {
                const username = users.get(ws);

                const message = {
                    username,
                    text: msg.text,
                    timestamp: Date.now(),
                };
                messages.push(message);

                for (let client of wss.clients) {
                    if (client.readyState === ws.OPEN) {
                        client.send(
                            JSON.stringify({ type: "msg", ...messages })
                        );
                    }
                }
                console.log(`${username} : ${msg.text} [${message.timestamp}]`);
            }
        });

        ws.on("close", () => {
            const username = users.get(ws);

            users.delete(ws);

            console.log(`❌ Клиент ${username} отключился`);
        });

        ws.on("error", (err) => {
            console.error("⚠️ Ошибка:", err);
        });

        app.get("/test", (request: Request, response: Response) => {
            response.status(200).send("Nigga");
        });

        server.listen(PORT, () => {
            console.log(`🚀 Сервер слушает http://localhost:${PORT}`);
        });
    });
});

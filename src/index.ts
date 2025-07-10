import express, { type Request, type Response } from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { type Message } from "./types/meta";

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

const PORT = 3001;

const users = new Map();


const messages: Message[] = [];

wss.on("connection", (ws) => {
    console.log("✅ Новый клиент подключился");

    // ws.onmessage("message", (data) => {
    //     let parsed;

    //     try {
    //         parsed = JSON.parse(data.toString());
    //     } catch (err) {
    //         ws.send(
    //             JSON.stringify({ type: "error", message: "НЕ ВЕРНЫЙ JSON" })
    //         );
    //         ws.close();
    //     }

    //     if (parsed.type !== "init" || !parsed.username) {
    //         ws.send(
    //             JSON.stringify({
    //                 type: "error",
    //                 message: "Введи имя свое",
    //             })
    //         );
    //         return;
    //     }

    //     const username = parsed?.username;

    //     users.set(ws, username);

    //     console.log(`${username} зашел в чат`);

    //     ws.send(JSON.stringify({ type: "history", messages }));

    // ws.onmessage = (event) => {
    //     console.log("event", JSON.stringify(event));
    //     // try {
    //     //     // const data = JSON.parse(toString(event.data));
    //     //     console.log("Received:", data);
    //     // } catch (err) {
    //     //     console.error("Failed to parse message:", event.data);
    //     // }
    // };

    ws.on("message", (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        } catch {
            return;
        }

        if (msg.type === "msg" && typeof msg.text === "string") {
            const username = users.get(ws);

            console.log("username: ", username);

            const message = {
                username,
                text: msg.text,
                timestamp: Date.now().toLocaleString("ru-RU"),
            };

            messages.push(message);

            console.log("MESSAGE: ", JSON.stringify(message));

            for (let client of wss.clients) {
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify({ type: "msg", ...messages }));
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
});

app.get("/test", (request: Request, response: Response) => {
    response.status(200).send("knigga");
});

server.listen(PORT, () => {
    console.log(`🚀 Сервер слушает http://localhost:${PORT}`);
});

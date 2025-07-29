import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { corsMiddleware } from "./middlewares/CORS";
import { clientConnectionController } from "./controllers/webSocketController";

const app = express();
app.use(corsMiddleware);

const server = http.createServer(app);

const wsServer = new WebSocketServer({ server });

wsServer.on("connection", (ws) => clientConnectionController(ws, wsServer));

const PORT = 3001;

server.listen(PORT, () => {
    console.log(`🚀 Сервер слушает http://localhost:${PORT}`);
});
    app.get("/test", (_, response) => {
        response.status(200).send("All is good");
    });

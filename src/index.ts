import http from 'http';
import dotenv from 'dotenv';
import express from 'express';
import { clientConnectionController } from './controllers/webSocketController';
import { WebSocketServer } from 'ws';
import { corsMiddleware } from './middlewares/CORS';
import { connectMongodb } from './db/mongo';


dotenv.config();

const app = express();
app.use(corsMiddleware);

app.get('/test', (_, response) => {
  response.status(200).send('All is good');
});

connectMongodb();

const server = http.createServer(app);
const websocketServer = new WebSocketServer({ server });

websocketServer.on('connection', (websocket) => clientConnectionController(websocket, websocketServer));

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`🚀 Сервер слушает http://localhost:${PORT}`);
});

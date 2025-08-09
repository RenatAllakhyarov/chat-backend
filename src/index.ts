import http from 'http';
import dotenv from 'dotenv';
import express from 'express';
import ClientConnectionService from './services/ClientConnectionService/index';
import { DataBaseConnection } from './services/DataBaseConnectionService';
import { corsMiddleware } from './middlewares/CORS';
import { WebSocketServer } from 'ws';

dotenv.config();

const app = express();
app.use(corsMiddleware);

app.use(express.json());

app.get('/test', (_, response) => {
  response.status(200).send('All is good');
});

export const dataBaseConnection = new DataBaseConnection();
dataBaseConnection.connectMongodb();

const server = http.createServer(app);
const websocketServer = new WebSocketServer({ server });

websocketServer.on('connection', (websocket) =>
  ClientConnectionService.clientConnection(websocket, websocketServer)
);

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`🚀 Сервер слушает http://localhost:${PORT}`);
});

import http from 'http';
import dotenv from 'dotenv';
import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import ClientConnectionService from './services/ClientConnectionService/index';
import { DataBaseConnection } from './services/DataBaseConnectionService';
import { corsMiddleware } from './middlewares/CORS';
import { swaggerOptions } from './config/swagger';
import { WebSocketServer } from 'ws';

dotenv.config();

const app = express();
app.use(corsMiddleware);

app.use(express.json());

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /test:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Check if the chat backend server is running and healthy
 *     responses:
 *       200:
 *         description: Server is running successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "All is good"
 *       500:
 *         description: Server internal error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

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

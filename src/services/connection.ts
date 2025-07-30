import {
    parseClientMessage,
    messageHandlers,
    sendingMessage,
  } from './handlers';
import type { WebSocket, WebSocketServer } from 'ws';
import { userSocketMap } from '../storage/chatStorage';


class ClientConnectionService {
  public static clientConnection(websocket: WebSocket, websocketserver: WebSocketServer) {
    websocket.on('message', async (raw) => {
      const parsed = parseClientMessage(raw, websocket);

      if (!parsed) {
        return;
      }

      const handler = messageHandlers[parsed.type];

      if (handler) {
        await handler(websocket, websocketserver, parsed);
      } else {
        sendingMessage(websocket, { type: 'error', message: 'Unknown message type' });
      }
    });

    websocket.on('close', () => {
      const username = userSocketMap.get(websocket);
      userSocketMap.delete(websocket);
    });

    websocket.on('error', (err) => {
      console.error('Error:', err);
    });
  }
}

export default ClientConnectionService;

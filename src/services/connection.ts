import {
  parseClientMessage,
  messageHandlers,
  sendingMessage,
} from './handlers';
import type { WebSocket, WebSocketServer } from 'ws';
import { userSocketMap } from '../storage/chatStorage';

class ClientConnectionService {
  public static clientConnection(
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer
  ) {
    clientSocket.on('message', async (raw) => {
      const parsed = parseClientMessage(raw, clientSocket);

      if (!parsed) {
        return;
      }

      const handler = messageHandlers[parsed.type];

      if (handler) {
        await handler(clientSocket, webSocketServer, parsed);
      } else {
        sendingMessage(clientSocket, {
          type: 'error',
          message: 'Unknown message type',
        });
      }
    });

    clientSocket.on('close', () => {
      const username = userSocketMap.get(clientSocket);
      userSocketMap.delete(clientSocket);
    });

    clientSocket.on('error', (err) => {
      console.error('Error:', err);
    });
  }
}

export default ClientConnectionService;

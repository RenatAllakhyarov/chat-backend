import { WebSocketController } from '../WebSocketController';
import { userSocketMap } from '../../storage/chatStorage';
import type { WebSocket, WebSocketServer } from 'ws';

class ClientConnectionService {
  public static clientConnection(
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer
  ) {
    clientSocket.on('message', async (raw) => {
      const parsed = WebSocketController.parseClientMessage(raw, clientSocket);

      if (!parsed) {
        return;
      }

      const handler = WebSocketController.messageHandlers[parsed.type];

      if (!handler) {
        WebSocketController.sendingMessage(clientSocket, {
          type: 'error',
          message: 'Unknown message type',
        });
        return;
      }

      await handler(clientSocket, webSocketServer, parsed);
    });

    clientSocket.on('close', () => {
      const username = userSocketMap.get(clientSocket);
      console.log('Socket closed, username:', username);
      console.log('Socket closed, map size:', userSocketMap.size);
      console.log('Socket exists in map:', userSocketMap.has(clientSocket));
      WebSocketController.handleUserDisconnect(clientSocket, webSocketServer);
    });

    clientSocket.on('error', (err) => {
      console.error('Error:', err);
    });
  }
}

export default ClientConnectionService;

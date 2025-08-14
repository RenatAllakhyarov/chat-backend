import { MessageFileTypes } from '../../types/meta';
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

      if (!parsed) return;

      try {
        await WebSocketController.handleIncomingMessage(
          clientSocket,
          webSocketServer,
          parsed
        );
      } catch (error) {
        WebSocketController.sendingMessage(
          clientSocket,
          MessageFileTypes.ERROR,
          {
            message:
              error instanceof Error
                ? error.message
                : 'Server unexpected error',
          }
        );
      }
    });

    clientSocket.on('close', () => {
      WebSocketController.handleUserDisconnect(clientSocket, webSocketServer);
    });

    clientSocket.on('error', (err) => {
      console.error('WebSocket error:', err);
      WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
        message: 'Connection error',
      });
    });
  }
}

export default ClientConnectionService;

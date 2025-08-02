// src/ws/handlers.ts
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { ClientMessage, ServerMessages } from '../../types/meta';
import { DataBaseConnection } from '../DataBaseConnectionService/index';
import { userSocketMap } from '../../storage/chatStorage';
import { DataBaseAPI } from '../DataBaseAPI/index';


const dbConnection = new DataBaseConnection();
export class WebSocketController {
  public static async sendingMessage(
    websocket: WebSocket,
    message: ServerMessages
  ) {
    websocket.send(JSON.stringify(message));
  }

  public static parseClientMessage(
    rawData: RawData,
    clientSocket: WebSocket
  ): ClientMessage | undefined {
    try {
      return JSON.parse(rawData.toString()) as ClientMessage;
    } catch {
      WebSocketController.sendingMessage(clientSocket, {
        type: 'error',
        message: 'Incorrect JSON',
      });

      return undefined;
    }
  }

  public static async handleInit(
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: ClientMessage
  ) {
    if (!dbConnection.getisDbConnected()) {
      WebSocketController.sendingMessage(clientSocket, {
        type: 'error',
        message: 'Database is unavailable',
      });
      clientSocket.close(1000, 'DB connection failed');
      return;
    }

    if (parsed.type !== 'init') {
      return;
    }

    if (!parsed.username) {
      WebSocketController.sendingMessage(clientSocket, {
        type: 'error',
        message: 'Write your nickname',
      });

      return;
    }

    userSocketMap.set(clientSocket, parsed.username);

    await DataBaseAPI.getOrCreateUser(parsed.username);

    const historyMessages = await DataBaseAPI.getRecentMessages();

    WebSocketController.sendingMessage(clientSocket, {
      type: 'history',
      messages: historyMessages,
    });
  }

  public static async handleMessage(
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: ClientMessage
  ) {
    if (!dbConnection.getisDbConnected()) {
      WebSocketController.sendingMessage(clientSocket, {
        type: 'error',
        message: 'Database is unavailable',
      });
      clientSocket.close(1000, 'DB connection failed');
      return;
    }
    if (parsed.type !== 'msg') {
      return;
    }

    if (typeof parsed.text !== 'string') return;

    const username = userSocketMap.get(clientSocket);

    if (!username) return;

    try {
      const message = await DataBaseAPI.saveMessage(username, parsed.text);
      const websocketMessage = {
        id: message._id.toString(),
        username: message.sender,
        text: message.text,
        timestamp: message.timestamp.toLocaleString('ru-RU'),
      };

      for (const client of webSocketServer.clients) {
        if (client.readyState === WebSocket.OPEN) {
          WebSocketController.sendingMessage(client, { type: 'msg', ...websocketMessage });
        }
      }
    } catch (error) {
      WebSocketController.sendingMessage(clientSocket, {
        type: 'error',
        message: 'Failed to send message',
      });
    }
  }

  public static messageHandlers: Record<
    string,
    (
      clientSocket: WebSocket,
      webSocketServer: WebSocketServer,
      parsed: ClientMessage
    ) => Promise<void>
  > = {
    init: this.handleInit,
    msg: this.handleMessage,
  };
}

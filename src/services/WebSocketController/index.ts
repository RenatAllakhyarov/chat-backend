import { ClientMessage, ServerMessages } from '../../types/meta';
import { userSocketMap } from '../../storage/chatStorage';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { DataBaseAPI } from '../DataBaseAPI/index';
import { dataBaseConnection } from '../../index';

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
    if (!dataBaseConnection.getIsDbConnected()) {
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
    console.log('Added to map:', parsed.username);

    await DataBaseAPI.getOrCreateUser(parsed.username);

    const onlineUsers = await DataBaseAPI.getOnlineUsers();

    WebSocketController.sendingMessage(clientSocket, {
      type: 'online_users',
      users: onlineUsers,
    });

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
    if (!dataBaseConnection.getIsDbConnected()) {
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

    console.log('Setting user online:', username);
    await DataBaseAPI.setUserOnline(username);
    console.log('User online set successfully');

    try {
      const message = await DataBaseAPI.saveMessage(username, parsed.text);
      const websocketMessage = {
        id: message._id.toString(),
        username: message.sender,
        text: message.text,
        timestamp: message.timestamp,
      };

      for (const client of webSocketServer.clients) {
        if (client.readyState === WebSocket.OPEN) {
          WebSocketController.sendingMessage(client, {
            type: 'msg',
            ...websocketMessage,
          });
        }
      }
    } catch (error) {
      WebSocketController.sendingMessage(clientSocket, {
        type: 'error',
        message: 'Failed to send message',
      });
    }
  }

  public static async handleUserDisconnect(
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer
  ) {
    console.log('=== User disconnect handler called ===');
    try {
      const username = userSocketMap.get(clientSocket);
      console.log('Disconnect attempt for:', username);

      if (!username) {
        console.log('No username found for socket');
        return;
      }

      console.log('Setting user offline:', username);
      await DataBaseAPI.setUserOffline(username);
      userSocketMap.delete(clientSocket);
      console.log('User removed from map:', username);

      await this.broadcastOnlineUsers(webSocketServer);
    } catch (error) {
      console.error(`Failed to set user offline`, error);
    }
  }

  public static async broadcastOnlineUsers(websocketServer: WebSocketServer) {
    try {
      const onlineUsers = await DataBaseAPI.getOnlineUsers();

      const message: ServerMessages = {
        type: 'online_users',
        users: onlineUsers,
      };

      for (const client of websocketServer.clients) {
        if (client.readyState === WebSocket.OPEN) {
          WebSocketController.sendingMessage(client, message);
        }
      }
    } catch (error) {
      console.error(`Failed to send list of online users`, error);
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

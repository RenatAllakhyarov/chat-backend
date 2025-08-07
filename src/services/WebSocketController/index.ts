import { ClientMessage, ServerMessages } from '../../types/meta';
import { userSocketMap } from '../../storage/chatStorage';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { DataBaseAPI } from '../DataBaseAPI/index';
import { dataBaseConnection } from '../../index';

export class WebSocketController {
  public static async sendingMessage(
    websocket: WebSocket,
    type: string,
    messageData: any
  ) {
    const fullMessage = { type, ...messageData };
    websocket.send(JSON.stringify(fullMessage));
  }

  public static parseClientMessage(
    rawData: RawData,
    clientSocket: WebSocket
  ): ClientMessage | undefined {
    try {
      return JSON.parse(rawData.toString()) as ClientMessage;
    } catch {
      WebSocketController.sendingMessage(clientSocket, 'error', {
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
      WebSocketController.sendingMessage(clientSocket, 'error', {
        message: 'Database is unavailable',
      });

      clientSocket.close(1000, 'DB connection failed');
      return;
    }

    if (parsed.type !== 'init') {
      return;
    }

    if (!parsed.username) {
      WebSocketController.sendingMessage(clientSocket, 'error', {
        message: 'Write your nickname',
      });

      return;
    }

    userSocketMap.set(clientSocket, parsed.username);

    console.log('Added to map:', parsed.username);

    await DataBaseAPI.checkingUserExistence(parsed.username);

    console.log('Setting user online:', parsed.username);

    await DataBaseAPI.setUserOnline(parsed.username);

    console.log('User online set successfully');

    await WebSocketController.sendAllUsers(clientSocket);

    const historyMessages = await DataBaseAPI.getRecentMessages();

    WebSocketController.sendingMessage(clientSocket, 'history', {
      messages: historyMessages,
    });
  }

  public static async handleMessage(
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: ClientMessage
  ) {
    if (!dataBaseConnection.getIsDbConnected()) {
      WebSocketController.sendingMessage(clientSocket, 'error', {
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
        timestamp: message.timestamp,
      };

      for (const client of webSocketServer.clients) {
        if (client.readyState === WebSocket.OPEN) {
          WebSocketController.sendingMessage(client, 'msg', {
            ...websocketMessage,
          });
        }
      }
    } catch (error) {
      WebSocketController.sendingMessage(clientSocket, 'error', {
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

      await this.broadcastUserStatusChange(username, false, webSocketServer);

      userSocketMap.delete(clientSocket);

      console.log('User removed from map:', username);

      await this.broadcastAllUsers(webSocketServer);
    } catch (error) {
      console.error(`Failed to set user offline`, error);
    }
  }

  private static async broadcastAllUsers(websocketServer: WebSocketServer) {
    try {
      const allUserswithstatus = await DataBaseAPI.ensureUserExists();

      const message: ServerMessages = {
        type: 'usersStatus',
        users: allUserswithstatus,
      };

      for (const client of websocketServer.clients) {
        WebSocketController.sendingMessage(client, 'userStatus', message);
      }
    } catch (error) {
      console.error(`Failed to send list of all users with status`, error);
    }
  }

  private static async sendAllUsers(clientSocket: WebSocket) {
    try {
      const allUsersWithStatus = await DataBaseAPI.ensureUserExists();

      const message: ServerMessages = {
        type: 'usersStatus',
        users: allUsersWithStatus,
      };

      WebSocketController.sendingMessage(clientSocket, 'userStatus', message);
    } catch (error) {
      console.error(`Failed to send full user status`, error);
    }
  }

  private static async broadcastUserStatusChange(
    username: string,
    isOnline: boolean,
    webSocketServer: WebSocketServer
  ) {
    try {
      const message: ServerMessages = {
        type: 'userStatusChanged',
        username: username,
        isOnline: isOnline,
      };

      for (const clients of webSocketServer.clients) {
        if (clients.readyState !== WebSocket.OPEN) {
          continue;
        }
        WebSocketController.sendingMessage(clients, 'userStatus', message);
      }
    } catch (error) {
      console.error(`Failed to Change user status ${username}`, error);
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

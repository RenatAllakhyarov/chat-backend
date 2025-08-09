import { MessageHandlerService } from '../MessageTypeHandlerService';
import { ClientMessage, ServerMessages } from '../../types/meta';
import { userSocketMap } from '../../storage/chatStorage';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { DataBaseAPI } from '../DataBaseAPI/index';
import { dataBaseConnection } from '../../index';
import { User } from '../../models/User';

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

    const username = parsed.username;

    userSocketMap.set(clientSocket, parsed.username);

    console.log('Added to map:', parsed.username);

    await DataBaseAPI.checkingUserExistence(parsed.username);

    console.log('Setting user online:', parsed.username);

    await DataBaseAPI.setUserOnline(parsed.username);

    console.log('User online set successfully');

    await WebSocketController.sendAllUsers(clientSocket);

    const historyMessages = await DataBaseAPI.getRecentMessages();

    await WebSocketController.broadcastUserStatusChange(
      username,
      true,
      webSocketServer
    );

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
    if (
      parsed.type !== 'textMessage' &&
      parsed.type !== 'audioMessage' &&
      parsed.type !== 'fileMessage'
    ) {
      return;
    }

    const username = userSocketMap.get(clientSocket);
    if (!username) return;

    if (parsed.type === 'textMessage') {
      try {
        const result = await MessageHandlerService.handleTextMessage(
          parsed,
          username
        );

        for (const client of webSocketServer.clients) {
          if (client.readyState === WebSocket.OPEN) {
            WebSocketController.sendingMessage(client, 'msg', result);
          }
        }
      } catch (error) {
        WebSocketController.sendingMessage(clientSocket, 'error', {
          message: 'Failed to send text message',
        });
      }

      return;
    }

    if (parsed.type === 'audioMessage') {
      try {
        const result = await MessageHandlerService.handleAudioMessage(
          {file: parsed.file},
          username
        );
        for (const client of webSocketServer.clients) {
          if (client.readyState === WebSocket.OPEN) {
            WebSocketController.sendingMessage(client, 'msg', result);
          }
        }
      } catch (error) {
        WebSocketController.sendingMessage(clientSocket, 'error', {
          message: 'Failed to send audio message',
        });
      }

      return;
    }

    if (parsed.type === 'fileMessage') {
      try {
        const result = await MessageHandlerService.handleFileMessage(
          {file: parsed.file},
          username
        );
        for (const client of webSocketServer.clients) {
          if (client.readyState === WebSocket.OPEN) {
            WebSocketController.sendingMessage(client, 'msg', result);
          }
        }
      } catch (error) {
        WebSocketController.sendingMessage(clientSocket, 'error', {
          message: 'Failed to send audio message',
        });
      }

      return;
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
      const allUsersWithStatus = await DataBaseAPI.getAllUsersData();

      const message: ServerMessages = {
        type: 'usersData',
        users: allUsersWithStatus,
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
      const allUsersWithStatus = await DataBaseAPI.getAllUsersData();

      const message: ServerMessages = {
        type: 'usersData',
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
      const user = await User.findOne({ username });

      if (!user) {
        console.error(`User ${username} not found`);
        return;
      }

      const message: ServerMessages = {
        username: username,
        type: 'userStatusChanged',
        id: user._id.toString(),
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

import {
  TClientMessage,
  TServerMessages,
  MessageFileTypes,
  TInitMessage,
  TFileMessageClient,
  TTextMessageClient,
  TMessageHandler,
} from '../../types/meta';
import { MessageHandlerService } from '../MessageTypeHandlerService';
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
  ): TClientMessage | undefined {
    try {
      const parsed = JSON.parse(rawData.toString());

      if (
        parsed.type === MessageFileTypes.INIT &&
        typeof parsed.username === 'string' &&
        typeof parsed.id === 'string'
      ) {
        return parsed as TInitMessage;
      }

      if (
        parsed.type === MessageFileTypes.TEXT &&
        typeof parsed.text === 'string'
      ) {
        return parsed as TTextMessageClient;
      }

      if (
        parsed.type === MessageFileTypes.FILE &&
        typeof parsed.file?.data === 'string'
      ) {
        return parsed as TFileMessageClient;
      }

      WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
        message: 'Invalid message structure',
      });
      return undefined;
    } catch {
      WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
        message: 'Incorrect JSON',
      });
      return undefined;
    }
  }

  public static handleInit = async (
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: TInitMessage
  ): Promise<void> => {
    try {
      if (!dataBaseConnection.getIsDbConnected()) {
        WebSocketController.sendingMessage(clientSocket, 'error', {
          message: 'Database is unavailable',
        });

        clientSocket.close(1000, 'DB connection failed');
        return;
      }

      const username = parsed.username;

      userSocketMap.set(clientSocket, parsed.username);

      console.log('Added to map:', parsed.username);

      await DataBaseAPI.checkingUserExistence(parsed.username);

      console.log('Setting user online:', parsed.username);

      await DataBaseAPI.setUserOnline(parsed.username);

      console.log('User online set successfully');

      await WebSocketController.broadcastUserStatusChange(
        username,
        true,
        webSocketServer
      );

      await WebSocketController.sendAllUsers(clientSocket);

      await WebSocketController.sendHistory(clientSocket);
    } catch (error) {
      console.error('Error in handleInit', error);

      WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
        message: 'Server unexpected error during initialization',
      });

      clientSocket.close(1000, 'Initialization failed');
    }
  };

  public static handleTextMessage = async (
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: TTextMessageClient
  ): Promise<void> => {
    const username = userSocketMap.get(clientSocket);

    if (!username) return;

    try {
      const result = await MessageHandlerService.handleTextMessage(
        parsed.text,
        username
      );

      WebSocketController.sendMessageToAllClients(
        webSocketServer,
        MessageFileTypes.MESSAGE,
        result
      );
    } catch (error) {
      console.error('Error in handleTextMessage', error);

      WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
        message: 'Failed to send text message',
      });
    }
  };

  public static handleFileMessage = async (
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: TFileMessageClient
  ): Promise<void> => {
    const username = userSocketMap.get(clientSocket);

    if (!username) return;

    try {
      const result = await MessageHandlerService.handleFileMessage(
        parsed.file,
        username
      );

      WebSocketController.sendMessageToAllClients(
        webSocketServer,
        MessageFileTypes.FILE,
        result
      );
    } catch (error) {
      console.error('Error in handleFileMessage', error);

      WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
        message: 'Failed to send file message',
      });
    }
  };

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

      WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
        message: 'Server unexpected error while setting user offline',
      });
    }
  }

  private static async broadcastAllUsers(websocketServer: WebSocketServer) {
    try {
      const allUsersWithStatus = await DataBaseAPI.getAllUsersData();

      const message: TServerMessages = {
        type: MessageFileTypes.USER_DATA,
        users: allUsersWithStatus,
      };

      WebSocketController.sendMessageToAllClients(
        websocketServer,
        MessageFileTypes.USER_DATA,
        message
      );
    } catch (error) {
      console.error(`Failed to send list of all users with status`, error);

      WebSocketController.sendMessageToAllClients(
        websocketServer,
        MessageFileTypes.ERROR,
        { message: 'Server error while updating users list' }
      );
    }
  }

  private static async sendAllUsers(clientSocket: WebSocket) {
    try {
      const allUsersWithStatus = await DataBaseAPI.getAllUsersData();

      const message: TServerMessages = {
        type: MessageFileTypes.USER_DATA,
        users: allUsersWithStatus,
      };

      WebSocketController.sendingMessage(clientSocket, 'userStatus', message);
    } catch (error) {
      console.error(`Failed to send full user status`, error);

      WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
        message: 'Server unexpected error while sending users statuses',
      });
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

      const message: TServerMessages = {
        type: MessageFileTypes.USER_STATUS_CHANGED,
        id: user._id.toString(),
        isOnline: isOnline,
      };

      WebSocketController.sendMessageToAllClients(
        webSocketServer,
        MessageFileTypes.USER_DATA,
        message
      );
    } catch (error) {
      console.error(`Failed to Change user status ${username}`, error);

      WebSocketController.sendMessageToAllClients(
        webSocketServer,
        MessageFileTypes.ERROR,
        { message: 'Server unexpected error while changing status' }
      );
    }
  }

  public static async handleIncomingMessage(
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: TClientMessage
  ): Promise<void> {
    try {
      switch (parsed.type) {
        case MessageFileTypes.INIT:
          await WebSocketController.handleInit(
            clientSocket,
            webSocketServer,
            parsed
          );
          break;

        case MessageFileTypes.TEXT:
          await WebSocketController.handleTextMessage(
            clientSocket,
            webSocketServer,
            parsed
          );
          break;

        case MessageFileTypes.FILE:
          await WebSocketController.handleFileMessage(
            clientSocket,
            webSocketServer,
            parsed
          );
          break;

        default:
          const unexpectedType: never = parsed;
          throw new Error(`Unexpected message type: ${unexpectedType}`);
      }
    } catch (error) {
      console.error('Error in handleIncomingMessage', error);

      WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
        message: 'Server unexpected error during message processing',
      });
    }
  }

  private static sendMessageToAllClients(
    webSocketServer: WebSocketServer,
    type: MessageFileTypes,
    message: any
  ) {
    try {
      webSocketServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          WebSocketController.sendingMessage(client, type, message);
        }
      });
    } catch (error) {
      console.error('Error in sendMessageToAllClients', error);

      WebSocketController.sendMessageToAllClients(
        webSocketServer,
        MessageFileTypes.ERROR,
        {
          message:
            'Server unexpected error while sending message to all clients',
        }
      );
    }
  }

  private static async sendHistory(clientSocket: WebSocket) {
    try {
      const historyMessages = await DataBaseAPI.getRecentMessages();

      WebSocketController.sendingMessage(
        clientSocket,
        MessageFileTypes.HISTORY,
        { messages: historyMessages }
      );
    } catch (error) {
      console.error('Error in sendingHistory', error);

      WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
        message: 'Server unexpected error while sending message to all clients',
      });
    }
  }

  public static messageHandlers: TMessageHandler = {
    [MessageFileTypes.INIT]: this.handleInit,
    [MessageFileTypes.TEXT]: this.handleTextMessage,
    [MessageFileTypes.FILE]: this.handleFileMessage,
  };
}

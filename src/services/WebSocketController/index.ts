import { MessageHandlerService } from '../MessageTypeHandlerService';
import { IFileData, TClientMessage, TServerMessages, MessageFileTypes, TInitMessage, TFileMessageClient, TTextMessageClient} from '../../types/meta';
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

    if (parsed.type === MessageFileTypes.INIT && 
        typeof parsed.username === 'string' &&
        typeof parsed.id === 'string') {
      return parsed as TInitMessage;
    }

    if (parsed.type === MessageFileTypes.TEXT && 
        typeof parsed.text === 'string') {
      return parsed as TTextMessageClient;
    }

    if (parsed.type === MessageFileTypes.FILE && 
        typeof parsed.file?.data === 'string') {
      return parsed as TFileMessageClient;
    }

    WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
      message: 'Invalid message structure'
    });
    return undefined;
  } catch {
    WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
      message: 'Incorrect JSON'
    });
    return undefined;
  }
}

  public static handleInit = async(
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: TInitMessage
  ): Promise<void> => {

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

    await WebSocketController.sendAllUsers(clientSocket);

    const historyMessages = await DataBaseAPI.getRecentMessages();

    await WebSocketController.broadcastUserStatusChange(
      username,
      true,
      webSocketServer
    );

    WebSocketController.sendingMessage(clientSocket, MessageFileTypes.HISTORY, {
      messages: historyMessages,
    });
  }

  public static handleTextMessage = async(
  clientSocket: WebSocket,
  webSocketServer: WebSocketServer,
  parsed: TTextMessageClient
): Promise<void> => {
  const username = userSocketMap.get(clientSocket);
  if (!username) return;

  try {
    const result = await MessageHandlerService.handleTextMessage(
      {text: parsed.text},
       username
      );
    
    webSocketServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        WebSocketController.sendingMessage(client, 'msg', result);
      }
    });
  } catch (error) {
    console.error('Text message error:', error);
    clientSocket.close(1000, 'Processing failed');
  }
}

  public static handleFileMessage = async(
  clientSocket: WebSocket,
  webSocketServer: WebSocketServer,
  parsed: TFileMessageClient
): Promise<void> => {
  const username = userSocketMap.get(clientSocket);

  if (!username) return;

  try {
    const result = await MessageHandlerService.handleFileMessage(
      { file: parsed.file },
      username
    );
    
    for (const client of webSocketServer.clients) {
      if (client.readyState === WebSocket.OPEN) {
        WebSocketController.sendingMessage(client, MessageFileTypes.MESSAGE, result);
      }
    }
  } catch (error) {
    WebSocketController.sendingMessage(clientSocket, MessageFileTypes.ERROR, {
      message: 'Failed to send file message',
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
      const allUsersWithStatus = await DataBaseAPI.getAllUsersData();

      const message: TServerMessages = {
        type: MessageFileTypes.USERDATA,
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

      const message: TServerMessages = {
        type: MessageFileTypes.USERDATA,
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

      const message: TServerMessages = {
        username: username,
        type: MessageFileTypes.USERSTATUSCHANGED,
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

  public static messageHandlers: {
  [MessageFileTypes.INIT]: (
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: TInitMessage 
  ) => Promise<void>;
  [MessageFileTypes.TEXT]: (
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer, 
    parsed: TTextMessageClient
  ) => Promise<void>;
  [MessageFileTypes.FILE]: (
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: TFileMessageClient
  ) => Promise<void>;
} = {
  [MessageFileTypes.INIT]: this.handleInit.bind(this),
  [MessageFileTypes.TEXT]: this.handleTextMessage.bind(this),
  [MessageFileTypes.FILE]: this.handleFileMessage.bind(this)
};
}

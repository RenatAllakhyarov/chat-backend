// src/ws/handlers.ts
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { userSocketMap, chatMessages } from '../storage/chatStorage';
import { ClientMessage, ServerMessages } from '../types/meta';
import { getUserByUsername } from './DataBaseService/getUserByUsername';
import { isDbConnected } from '../db/mongo';
import { getMessages } from './DataBaseService/getMessages';
import { Message } from '../models/Message';
import { saveMessage } from './DataBaseService/saveMessage';

export function sendingMessage(websocket: WebSocket, message: ServerMessages) {
  websocket.send(JSON.stringify(message));
}

export function parseClientMessage(
  rawData: RawData,
  clientSocket: WebSocket
): ClientMessage | undefined {
  try {
    return JSON.parse(rawData.toString()) as ClientMessage;
  } catch {
    sendingMessage(clientSocket, { type: 'error', message: 'Incorrect JSON' });

    return undefined;
  }
}

export async function handleInit(
  clientSocket: WebSocket,
  webSocketServer: WebSocketServer,
  parsed: ClientMessage
) {
  if (!isDbConnected) {
    sendingMessage(clientSocket, {
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
    sendingMessage(clientSocket, {
      type: 'error',
      message: 'Write your nickname',
    });

    return;
  }

  userSocketMap.set(clientSocket, parsed.username);

  await getUserByUsername.getOrCreateUser(parsed.username);

  const historyMessages = await getMessages.getRecentMessages();

  sendingMessage(clientSocket, { type: 'history', messages: historyMessages });
}

export async function handleMessage(
  clientSocket: WebSocket,
  webSocketServer: WebSocketServer,
  parsed: ClientMessage
) {
  if (!isDbConnected) {
    sendingMessage(clientSocket, {
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
    const message = await saveMessage.saveMessage(username, parsed.text);
    const websocketMessage = {
      id: message._id.toString(),
      username: message.sender,
      text: message.text,
      timestamp: message.timestamp.toLocaleString('ru-RU'),
    };

    for (const client of webSocketServer.clients) {
      if (client.readyState === WebSocket.OPEN) {
        sendingMessage(client, { type: 'msg', ...websocketMessage });
      }
    }
  } catch (error) {
    sendingMessage(clientSocket, {
      type: 'error',
      message: 'Failed to send message',
    });
  }
}

export const messageHandlers: Record<
  string,
  (
    clientSocket: WebSocket,
    webSocketServer: WebSocketServer,
    parsed: ClientMessage
  ) => Promise<void>
> = {
  init: handleInit,
  msg: handleMessage,
};

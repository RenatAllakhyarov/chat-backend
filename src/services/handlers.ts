// src/ws/handlers.ts
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { userSocketMap, chatMessages } from '../storage/chatStorage';
import { ClientMessage, ServerMessages } from '../types/meta';
import { isDbConnected } from '../db/mongo';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { text } from 'stream/consumers';

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

  let user = await User.findOne({ username: parsed.username });
  if (!user) {
    user = new User({ username: parsed.username });
    await user.save();
  } else {
  }

  const dbMessages = await Message.find().sort({ timestamp: -1 }).limit(50);
  const wsMessages = dbMessages.map((dbMessage) => ({
    id: Math.random(),
    username: dbMessage.sender,
    text: dbMessage.text,
    timestamp: dbMessage.timestamp.toLocaleString('ru-RU'),
  }));

  sendingMessage(clientSocket, { type: 'history', messages: wsMessages });
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

  const message = {
    id: Math.random(),
    username,
    text: parsed.text,
    timestamp: new Date().toLocaleString('ru-RU'),
  };

  const dbMessage = new Message({
    sender: username,
    text: parsed.text,
    timestamp: new Date(),
  });

  try {
    await dbMessage.save();
  } catch (error) {}

  for (const client of webSocketServer.clients) {
    if (client.readyState === WebSocket.OPEN) {
      sendingMessage(client, { type: 'msg', ...message });
    }
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

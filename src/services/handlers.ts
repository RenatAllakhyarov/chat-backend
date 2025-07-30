// src/ws/handlers.ts
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { userSocketMap, chatMessages } from '../storage/chatStorage';
import { ClientMessage, ServerMessages } from '../types/meta';
import { Isdbconnected } from '../db/mongo';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { text } from 'stream/consumers';

export function sendingMessage(websocket: WebSocket, message: ServerMessages) {
  websocket.send(JSON.stringify(message));
}

export function parseClientMessage(
  rawdata: RawData,
  websocket: WebSocket
): ClientMessage | undefined {
  try {
    return JSON.parse(rawdata.toString()) as ClientMessage;
  } catch {
    sendingMessage(websocket, { type: 'error', message: 'Incorrect JSON' });

    return undefined;
  }
}

export async function handleInit(
  websocket: WebSocket,
  websocketserver: WebSocketServer,
  parsed: ClientMessage
) {
  if (!Isdbconnected) {
    sendingMessage(websocket, {
      type: 'error',
      message: 'Database is unavailable',
    });
    websocket.close(1000, 'DB connection failed');
    return;
  }

  if (parsed.type !== 'init') {
    return;
  }

  if (!parsed.username) {
    sendingMessage(websocket, {
      type: 'error',
      message: 'Write your nickname',
    });

    return;
  }

  userSocketMap.set(websocket, parsed.username);

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

  sendingMessage(websocket, { type: 'history', messages: wsMessages });
}

export async function handleMessage(
  websocket: WebSocket,
  websocketserver: WebSocketServer,
  parsed: ClientMessage
) {
  if (!Isdbconnected) {
    sendingMessage(websocket, {
      type: 'error',
      message: 'Database is unavailable',
    });
    websocket.close(1000, 'DB connection failed');
    return;
  }
  if (parsed.type !== 'msg') {
    return;
  }

  if (typeof parsed.text !== 'string') return;

  const username = userSocketMap.get(websocket);

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

  for (const client of websocketserver.clients) {
    if (client.readyState === WebSocket.OPEN) {
      sendingMessage(client, { type: 'msg', ...message });
    }
  }
}

export const messageHandlers: Record<
  string,
  (ws: WebSocket, wss: WebSocketServer, parsed: ClientMessage) => Promise<void>
> = {
  init: handleInit,
  msg: handleMessage,
};

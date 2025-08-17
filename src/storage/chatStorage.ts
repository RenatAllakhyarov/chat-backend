import { TWebSocketMessage } from '../types/meta';
import { WebSocket } from 'ws';

export const chatMessages: TWebSocketMessage[] = [];

export const userSocketMap = new Map<WebSocket, string>();

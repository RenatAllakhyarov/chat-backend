import ClientConnectionService from '../services/connection';
import { WebSocket, WebSocketServer } from 'ws';

export function clientConnectionController(
  websocket: WebSocket,
  websocketserver: WebSocketServer
) {
  ClientConnectionService.clientConnection(websocket, websocketserver);
}

import ClientConnectionService from '../services/connection';
import { WebSocket, WebSocketServer } from 'ws';

export function clientConnectionController(
  clientSocket: WebSocket,
  webSocketServer: WebSocketServer
) {
  ClientConnectionService.clientConnection(clientSocket, webSocketServer);
}

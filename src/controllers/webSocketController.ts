import ClientConnectionService from '../services/ClientConnectionService';
import { WebSocket, WebSocketServer } from 'ws';

export function clientConnectionController(
  clientSocket: WebSocket,
  webSocketServer: WebSocketServer
) {
  ClientConnectionService.clientConnection(clientSocket, webSocketServer);
}

import { WebSocket, WebSocketServer } from "ws";
import { clientConnection } from "../services/connection";

export function clientConnectionController(ws: WebSocket, wss: WebSocketServer){
    clientConnection(ws,wss);
}
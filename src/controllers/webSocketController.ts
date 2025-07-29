import ClientConnectionService from "../services/connection";
import { WebSocket, WebSocketServer } from "ws";

export function clientConnectionController(ws: WebSocket, wss: WebSocketServer){
    console.log("Вызван clientConnectionController");

    ClientConnectionService.clientConnection(ws,wss);
}
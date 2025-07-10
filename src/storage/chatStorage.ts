import { Message } from "../types/meta";
import { WebSocket } from "ws";

export const messages: Message[] = [];
export const users = new Map<WebSocket, string>();

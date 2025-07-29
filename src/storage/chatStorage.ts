import { Message } from "../types/meta";
import { WebSocket } from "ws";

export const chatMessages: Message[] = [];

export const userConnections = new Map<WebSocket, string>();

/* TODO 
interface IUserChat {
    name: string;
    messages: Message[];
};
  
interface IMessageBook {
    [key: string]: IUserChat;
}

interface IUserData {
    id: string;
    name: string;
    messagesBook: IMessageBook;
}

EXAMPLE:

const userData: IUserData = {
  id: "user1",
  name: "Alice",
  messagesBook: {
    "user2": {
        name: "Bob",
        messages: [
            {
              text: "Hello Bob!",
              timestamp: "2025-07-10 10:00"
            },
            {
              text: "Hi Alice!",
              timestamp: "2025-07-10 10:01"
            }
        ]
    },
    "user3": {
        name: "Ben",
        messages: [
            {
              text: "Hello Ben!",
              timestamp: "2025-07-10 10:00"
            },
            {
              text: "Hi Alice!",
              timestamp: "2025-07-10 10:01"
            }
        ]
    }
  }
};

*/

export interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export type ServerMessages =
  | { type: 'history'; messages: Message[] }
  | { type: 'error'; message: string }
  | { type: 'msg'; username: string; text: string; timestamp: number };

export type ClientMessage =
  | { type: 'init'; username: string; id: string }
  | { type: 'msg'; text: string };

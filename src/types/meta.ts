export interface Message {
  id: number;
  username: string;
  text: string;
  timestamp: string;
}

export type ServerMessages =
  | { type: 'history'; messages: Message[] }
  | { type: 'error'; message: string }
  | { type: 'msg'; username: string; text: string; timestamp: string };

export type ClientMessage =
  | { type: 'init'; username: string; id: string }
  | { type: 'msg'; text: string };

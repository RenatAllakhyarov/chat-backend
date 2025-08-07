export interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface IUser {
  id: string;
  username: string;
  isOnline: boolean;
}

export type ServerMessages =
  | { type: 'history'; messages: Message[] }
  | { type: 'error'; message: string }
  | {
      type: 'msg';
      username: string;
      text: string;
      timestamp: number;
      id: string;
    }
  | {
      type: 'usersStatus';
      users: IUser[];
    }
  | { type: 'userStatusChanged'; id: string; isOnline: boolean };

export type ClientMessage =
  | { type: 'init'; username: string; id: string }
  | { type: 'msg'; text: string };

export interface BaseMessage {
  id: string;
  username: string;
  timestamp: number;
}

export interface FileData {
  data: string;  
  name: string;  
  type: string;  
  size: number;  
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  text: string;
}

export interface AudioMessage extends BaseMessage {
  type: 'audio';
  file: FileData;
}

export interface FileMessage extends BaseMessage {
  type: 'file';
  file: FileData;
}

export interface IUser {
  id: string;
  username: string;
  isOnline: boolean;
}

export type WebSocketMessage = TextMessage | FileMessage | AudioMessage;

export type ServerMessages =
  | { type: 'history'; messages: WebSocketMessage[] }
  | { type: 'error'; message: string }
  | {
      type: 'msg';
      message: WebSocketMessage;
    }
  | {
      type: 'usersData';
      users: IUser[];
    }
  | {
      type: 'userStatusChanged';
      username: string;
      id: string;
      isOnline: boolean;
    };

export type ClientMessage =
  | { type: 'init'; username: string; id: string }
  | { type: 'textMessage'; text: string }
  | { type: 'audioMessage'; file: FileData }
  | {
      type: 'fileMessage';
      file: FileData;
    };

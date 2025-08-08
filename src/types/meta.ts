export interface BaseMessage {
  id: string;
  username: string;
  timestamp: number;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  text: string;
}

export interface AudioMessage extends BaseMessage {
  type: 'audio';
  audioUrl: string;
  duration: number;
}

export interface FileMessage extends BaseMessage {
  type: 'file';
  fileUrl: string;
  originalFileName: string;
  mimeType: string;
  size: number;
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
  | { type: 'audioMessage'; audioUrl: string; duration: number }
  | {
      type: 'fileMessage';
      fileUrl: string;
      fileName: string;
      mimeType: string;
      size?: number;
    };

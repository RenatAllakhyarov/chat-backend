import { WebSocket, WebSocketServer } from 'ws';

export interface IBaseMessage {
    id: string;
    sender: string;
    timestamp: number;
}

export enum MessageFileTypes {
    TEXT = 'text',
    FILE = 'file',
    INIT = 'init',
    MESSAGE = 'msg',
    HISTORY = 'history',
    ERROR = 'error',
    USER_DATA = 'userData',
    USER_STATUS_CHANGED = 'userStatusChanged',
    SEARCH = 'search',
    SEARCH_RESULT = 'searchResult',
    HISTORY_CHUNK = 'historyChunk',
}

export interface ISearchMessage {
    type: MessageFileTypes.SEARCH;
    query: string;
    limit?: number;
}

export interface ISearchResultMessage {
    type: MessageFileTypes.SEARCH_RESULT;
    messages: TWebSocketMessage[];
}

export interface IFileData {
    data: string;
    name: string;
    type: string;
    size: number;
}

export interface ITextMessage extends IBaseMessage {
    type: MessageFileTypes.TEXT;
    text: string;
}

export interface IFileMessage extends IBaseMessage {
    type: MessageFileTypes.FILE;
    fileData: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
}

export interface IUser {
    id: string;
    username: string;
    isOnline: boolean;
}

export interface IHistoryChunkMessage {
    type: MessageFileTypes.HISTORY_CHUNK;
    messages: TWebSocketMessage[];
    lastLoadedMessageId?: string;
}

export type TInitMessage = {
    type: MessageFileTypes.INIT;
    username: string;
    id: string;
};

export type TTextMessageClient = {
    type: MessageFileTypes.TEXT;
    text: string;
};

export type TFileMessageClient = {
    type: MessageFileTypes.FILE;
    file: IFileData;
};

export type THistoryMessageCLient = {
    type: MessageFileTypes.HISTORY;
    lastLoadedMessageId?: string;
};

export type TWebSocketMessage = ITextMessage | IFileMessage;

export type TServerMessages =
    | { type: MessageFileTypes.HISTORY; messages: TWebSocketMessage[] }
    | {
          type: MessageFileTypes.HISTORY_CHUNK;
          messages: TWebSocketMessage[];
          lastLoadedMessageId?: string;
      }
    | { type: MessageFileTypes.ERROR; message: string }
    | { type: MessageFileTypes.MESSAGE; message: TWebSocketMessage }
    | { type: MessageFileTypes.USER_DATA; users: IUser[] }
    | {
          type: MessageFileTypes.USER_STATUS_CHANGED;
          id: string;
          isOnline: boolean;
      }
    | { type: MessageFileTypes.SEARCH_RESULT; messages: TWebSocketMessage[] };

export type TClientMessage =
    | TInitMessage
    | TTextMessageClient
    | TFileMessageClient
    | ISearchMessage
    | THistoryMessageCLient;

export type TMessageHandler = {
    [K in TClientMessage['type']]: (
        clientSocket: WebSocket,
        webSocketServer: WebSocketServer,
        parsed: Extract<TClientMessage, { type: K }>
    ) => Promise<void>;
};

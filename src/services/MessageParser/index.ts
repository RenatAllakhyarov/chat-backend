import { TWebSocketMessage, MessageFileTypes } from '../../types/meta';
import { IMessage } from '../../models/Message';

export class MessageParser {
    public static transformDbMessageToWebSocket(
        dbMessage: IMessage
    ): TWebSocketMessage {
        switch (dbMessage.type) {
            case 'text':
                return {
                    id: dbMessage._id?.toString() || 'uknown',
                    type: MessageFileTypes.TEXT,
                    sender: dbMessage.sender,
                    text: dbMessage.text!,
                    timestamp: dbMessage.timestamp,
                };

            case 'file':
                return {
                    id: dbMessage._id?.toString() || 'uknown',
                    type: MessageFileTypes.FILE,
                    sender: dbMessage.sender,
                    fileData: dbMessage.fileData!,
                    fileName: dbMessage.fileName!,
                    mimeType: dbMessage.mimeType!,
                    fileSize: dbMessage.fileSize!,
                    timestamp: dbMessage.timestamp,
                };

            default:
                throw new Error(
                    `Unknown message type: ${(dbMessage as any).type}`
                );
        }
    }
}

import {
  IFileData,
  MessageFileTypes,
  TWebSocketMessage,
} from '../../types/meta';
import { DataBaseAPI } from '../DataBaseAPI';
import { MessageValidatorService } from '../MessageValidators';
import { Message } from '../../models/Message';

export class MessageHandlerService {
  public static async handleTextMessage(
    parsed: { text: string },
    username: string
  ): Promise<TWebSocketMessage> {
    
    MessageValidatorService.validateTextContent(parsed.text);

    const savedMessage = await DataBaseAPI.saveTextMessage(
      username,
      parsed.text
    );

    return {
      type: MessageFileTypes.TEXT,
      id: savedMessage._id.toString(),
      sender: username,
      text: parsed.text,
      timestamp: savedMessage.timestamp,
    };
  }

  public static async handleFileMessage(
    parsed: { file: IFileData },
    username: string
  ): Promise<TWebSocketMessage> {

    MessageValidatorService.validateFileContent(parsed.file);

    const savedMessage = await DataBaseAPI.saveFileMessage(
      username,
      parsed.file
    );

    const webSocketMessage: TWebSocketMessage = {
      type: MessageFileTypes.FILE,
      id: savedMessage._id.toString(),
      sender: username,
      fileData: savedMessage.fileData!,
      fileName: savedMessage.fileName!,
      fileSize: savedMessage.fileSize!,
      mimeType: savedMessage.mimeType!,
      timestamp: savedMessage.timestamp,
    };

    return webSocketMessage;
  }
}

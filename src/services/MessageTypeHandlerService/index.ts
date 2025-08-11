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
    text: string,
    username: string
  ): Promise<TWebSocketMessage> {

    MessageValidatorService.validateTextContent(text);

    const savedMessage = await DataBaseAPI.saveTextMessage(
      username,
      text
    );

    return {
      type: MessageFileTypes.TEXT,
      id: savedMessage._id.toString(),
      sender: username,
      text: text,
      timestamp: savedMessage.timestamp,
    };
  }

  public static async handleFileMessage(
    file: IFileData,
    username: string
  ): Promise<TWebSocketMessage> {

    MessageValidatorService.validateFileContent(file);

    const savedMessage = await DataBaseAPI.saveFileMessage(
      username,
      file
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

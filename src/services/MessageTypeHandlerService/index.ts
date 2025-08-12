import {
  IFileData,
  MessageFileTypes,
  TWebSocketMessage,
} from '../../types/meta';
import { MessageValidatorService } from '../MessageValidators';
import { DataBaseAPI } from '../DataBaseAPI';

export class MessageHandlerService {
  public static async handleTextMessage(
    text: string,
    username: string
  ): Promise<TWebSocketMessage> {

    MessageValidatorService.validateTextContent(text);
    try {
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
  } catch (error) {
    console.error(" Database error in saveTextMessage: ", error);
    throw new Error(' Server unexpected error');
  }
  }

  public static async handleFileMessage(
    file: IFileData,
    username: string
  ): Promise<TWebSocketMessage> {

    MessageValidatorService.validateFileContent(file);
    try{
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
  } catch (error) {
    console.error("Database error in saveFileMessage", error);
    throw new Error ('Server unexpected error');
  }
  }
}

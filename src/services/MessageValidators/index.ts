import {
  IFileData,
  TClientMessage,
  TWebSocketMessage,
  MessageFileTypes,
} from '../../types/meta';

export class MessageValidatorService {
  public static isValidFileData(file: unknown): file is IFileData {

    if (!file || typeof file !== 'object') return false;

    const fileData = file as IFileData;

    return (
      typeof fileData.data === 'string' &&
      typeof fileData.name === 'string' &&
      typeof fileData.type === 'string' &&
      typeof fileData.size === 'number' &&
      fileData.size >= 0 &&
      fileData.size <= 20 * 1024 * 1024
    );
  }

  public static validateTextContent(text: string): void {

    if (!text || text.trim().length === 0) {
      throw new Error('Text message cannot be empty');
    }

    if (text.length > 1000) {
      throw new Error('Text message too long');
    }
  }

  public static validateFileContent(file: IFileData): void {
    
    if (!this.isValidFileData(file)) {
      throw new Error('Invalid file data');
    }
  }
}

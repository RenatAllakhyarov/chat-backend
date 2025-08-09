import { FileData, WebSocketMessage } from '../../types/meta';
import { ClientMessage } from '../../types/meta';
import { Message } from '../../models/Message';
import { time, timeStamp } from 'console';

export class MessageHandlerService {
  public static async handleTextMessage(
    parsed: { text: string },
    username: string
  ): Promise<WebSocketMessage> {
    const { text } = parsed;

    if (!parsed.text || parsed.text.trim().length === 0) {
      throw new Error('Text message cannot be empty');
    }

    const message = new Message({
      type: 'text',
      sender: username,
      text: parsed.text,
      timestamp: Date.now(),
    });

    await message.save();

    const webSocketMessage: WebSocketMessage = {
      type: 'text',
      id: message._id.toString(),
      username: username,
      text: parsed.text,
      timestamp: message.timestamp,
    };

    return webSocketMessage;
  }

  public static async handleAudioMessage(
    parsed: { file: FileData },
    username: string
  ): Promise<WebSocketMessage> {
    const { file } = parsed;

    if (!file) {
      throw new Error('File data is required');
    }

    if (!file.data || typeof file.data !== 'string'){
      throw new Error("Invalid file data");
    }

    if (!file.name || file.name.trim().length === 0){
      throw new Error('File name is required');
    }

    if (file.size === undefined || file.size < 0){
      throw new Error('Invalid file size');
    }

    if (file.size > 20 * 1024 * 1024) {  
        throw new Error("File size must not exceed 20MB");
    }
    
    if (!file.type || file.type.trim().length === 0){
      throw new Error('File type is required');
    }

    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    if (!allowedAudioTypes.includes(file.type)) {
        throw new Error("Unsupported audio file type");
    }

    try{
      Buffer.from(file.data, 'base64');
    }catch(error){
      throw new Error("Invalid base64 encoding");
    }

    const message = new Message({
      type: 'audio',
      sender: username,
      fileData: Buffer.from(file.data, 'base64'),  
      fileName: file.name,                         
      mimeType: file.type,                         
      fileSize: file.size,                         
      timestamp: Date.now(),
    });

    await message.save();

    const webSocketMessage: WebSocketMessage = {
      type: 'audio',
      id: message._id.toString(),
      username: username,
      file: parsed.file,
      timestamp: message.timestamp,
    };

    return webSocketMessage;
  }

  public static async handleFileMessage(
    parsed: { file: FileData },
    username: string
  ): Promise<WebSocketMessage> {
    const { file } = parsed;

    if (!file) {
      throw new Error('File data is required');
    }

    if (!file.data || typeof file.data !== 'string'){
      throw new Error("Invalid file data");
    }

    if (!file.name || file.name.trim().length === 0){
      throw new Error('File name is required');
    }

    if (file.size === undefined || file.size < 0){
      throw new Error('Invalid file size');
    }

    if (file.size > 20 * 1024 * 1024) {  
        throw new Error("File size must not exceed 20MB");
    }
    
    if (!file.type || file.type.trim().length === 0){
      throw new Error('File type is required');
    }

     const allowedFileTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf',
        'text/plain',
        'audio/mpeg', 'audio/wav'
    ];
    if (!allowedFileTypes.includes(file.type)) {
        throw new Error("Unsupported audio file type");
    }

    try{
      Buffer.from(file.data, 'base64');
    }catch(error){
      throw new Error("Invalid base64 encoding");
    }

    const message = new Message({
      type: 'file',
      sender: username,
      fileData: Buffer.from(file.data, 'base64'),  
      fileName: file.name,                         
      mimeType: file.type,                         
      fileSize: file.size,                         
      timestamp: Date.now(),
    });

    await message.save();

    const webSocketMessage: WebSocketMessage = {
      type: 'file',
      id: message._id.toString(),
      username: username,
      file: parsed.file,
      timestamp: message.timestamp,
    };

    return webSocketMessage;
  }
}

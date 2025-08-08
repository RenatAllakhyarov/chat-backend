import { WebSocketMessage } from '../types/meta';
import { ClientMessage } from '../types/meta';
import { Message } from '../models/Message';
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
    parsed: { audioUrl: string; duration: number },
    username: string
  ): Promise<WebSocketMessage> {
    const { audioUrl } = parsed;

    if (!parsed.audioUrl || parsed.audioUrl.trim().length === 0) {
      throw new Error('Audio URL cannot be empty');
    }

    const { duration } = parsed;

    if (parsed.duration <= 0 || parsed.duration >= 3600) {
      throw new Error('Duration must be between 1 second and 1 hour');
    }

    const message = new Message({
      type: 'audio',
      sender: username,
      audioUrl: parsed.audioUrl,
      duration: parsed.duration,
      timestamp: Date.now(),
    });

    await message.save();

    const webSocketMessage: WebSocketMessage = {
      type: 'audio',
      id: message._id.toString(),
      username: username,
      audioUrl: parsed.audioUrl,
      duration: parsed.duration,
      timestamp: message.timestamp,
    };

    return webSocketMessage;
  }

  public static async handleFileMessage(
    parsed: {
      fileUrl: string;
      fileName: string;
      mimeType: string;
      size: number;
    },
    username: string
  ): Promise<WebSocketMessage> {
    const { fileUrl } = parsed;

    if (!parsed.fileUrl || parsed.fileUrl.trim().length === 0) {
      throw new Error('File Url cannot be empty');
    }

    const { fileName } = parsed;

    if (!parsed.fileName || parsed.fileName.trim().length === 0) {
      throw new Error('File name cannot be empty');
    }

    const { mimeType } = parsed;

    if (!parsed.mimeType || parsed.mimeType.trim().length === 0) {
      throw new Error('Mime type cannot be empty');
    }
    const { size } = parsed;

    if (parsed.size <= 0 || parsed.size > 10 * 1024 * 1024) {
      throw new Error('File size must be between 1 byte and 10MB');
    }

    const message = new Message({
      type: 'file',
      sender: username,
      fileUrl: parsed.fileUrl,
      originalFileName: parsed.fileName,
      mimeType: parsed.mimeType,
      size: parsed.size,
      timestamp: Date.now(),
    });

    await message.save();

    const webSocketMessage: WebSocketMessage = {
      type: 'file',
      id: message._id.toString(),
      username: username,
      fileUrl: parsed.fileUrl,
      originalFileName: parsed.fileName,
      mimeType: parsed.mimeType,
      size: parsed.size,
      timestamp: message.timestamp,
    };

    return webSocketMessage;
  }
}

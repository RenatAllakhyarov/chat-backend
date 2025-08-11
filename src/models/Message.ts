import { MessageFileTypes } from '../types/meta';
import { Schema, model } from 'mongoose';

export interface IMessage {
  type: 'text' | 'audio' | 'file';
  sender: string;
  timestamp: number;
  text?: string;
  fileData?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

const messageSchema = new Schema<IMessage>({
  type: {
    type: String,
    required: true,
    enum: Object.values(MessageFileTypes),
  },
  sender: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Number,
    required: true,
  },
  fileData: {
    type: String,
    required: false,
  },
  fileName: {
    type: String,
    required: false,
  },
  mimeType: {
    type: String,
    required: false,
  },
  fileSize: {
    type: Number,
    required: false,
  },
});

export const Message = model<IMessage>('Message', messageSchema);

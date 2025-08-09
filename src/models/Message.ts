import mongoose from 'mongoose';
import { Schema, model } from 'mongoose';

export interface IMessage {
  type: 'text' | 'audio' | 'file';
  sender: string;
  timestamp: number;
  text?: string;
  fileData?: Buffer;
  fileName?: string;
  mimeType?: string;
  fileSize?: string;
}

const messageSchema = new Schema<IMessage>({
  type: {
    type: String,
    required: true,
    enum: ['text', 'audio', 'file'],
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
    type: Buffer,
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

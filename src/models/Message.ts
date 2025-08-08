import mongoose from 'mongoose';
import { Schema, model } from 'mongoose';

export interface IMessage {
  type: 'text' | 'audio' | 'file';
  sender: string;
  text?: string;
  audioUrl?: string;
  duration?: number;
  fileUrl?: string;
  originalFileName?: string;
  mimeType?: string;
  size?: number;
  timestamp: number;
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
  audioUrl: {
    type: String,
    required: false,
  },
  duration: {
    type: Number,
    required: false,
  },
  originalFileName: {
    type: String,
    required: false,
  },
  fileUrl: {
    type: String,
    required: false,
  },
  mimeType: {
    type: String,
    required: false,
  },
  size: {
    type: Number,
    required: false,
  },
});

export const Message = model<IMessage>('Message', messageSchema);

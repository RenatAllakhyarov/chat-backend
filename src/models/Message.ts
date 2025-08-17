import { MessageFileTypes } from '../types/meta';
import mongoose, { Schema, model } from 'mongoose';

export interface IMessage {
    _id?: mongoose.Types.ObjectId;
    id: string;
    type: MessageFileTypes.TEXT | MessageFileTypes.FILE;
    sender: string;
    timestamp: number;
    text?: string;
    fileData?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
}

const messageSchema = new Schema<IMessage>({
    id: {
        type: String,
        required: false,
    },
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

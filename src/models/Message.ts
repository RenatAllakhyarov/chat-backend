import mongoose from "mongoose";
import {Schema, model} from "mongoose";

export interface IMessage{
    sender: string;
    text: string;
    timestamp: Date;
}

const messageSchema = new Schema<IMessage>({
    sender: {
        type: String,
        required: true
        
    },
    text: {
        type: String,
        requiered: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});


export const Message = model<IMessage>('Message', messageSchema)
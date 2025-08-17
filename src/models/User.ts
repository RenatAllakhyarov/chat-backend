import mongoose from 'mongoose';
import { Schema, model } from 'mongoose';

export interface IUser {
    username: string;
    isOnline: boolean;
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    isOnline: {
        type: Boolean,
        default: false,
        required: true,
    },
});

export const User = model<IUser>('User', userSchema);

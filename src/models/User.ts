import mongoose from "mongoose";
import {Schema, model} from "mongoose";

export interface IUser{
    username: string;
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true
    }
});


export const User = model<IUser>('User', userSchema)
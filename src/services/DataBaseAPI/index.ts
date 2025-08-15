import {
    IFileData,
    MessageFileTypes,
    IHistoryChunkMessage,
} from '../../types/meta';
import { IMessage, Message } from '../../models/Message';
import { IUser } from '../../types/meta';
import { User } from '../../models/User';
import { MessageParser } from '../MessageParser';

export class DataBaseAPI {
    public static async getRecentMessages(
        limit: number = 50,
        lastLoadedMessageId?: string
    ): Promise<IMessage[]> {
        try {
            if (!lastLoadedMessageId) {
                const dbMessages = await Message.find()
                    .sort({ timestamp: -1 })
                    .limit(limit)
                    .exec();

                const websocketMessages = dbMessages.map((dbMessage) =>
                    MessageParser.transformDbMessageToWebSocket(dbMessage)
                );

                return websocketMessages;
            }

            const lastMessage = await Message.findById(lastLoadedMessageId);

            if (!lastMessage) {
                return [];
            }

            const dbMessages = await Message.find({
                timestamp: { $lt: lastMessage.timestamp },
            })
                .sort({ timestamp: -1 })
                .limit(limit)
                .exec();

            const websocketMessages = dbMessages.map((dbMessage) =>
                MessageParser.transformDbMessageToWebSocket(dbMessage)
            );

            return websocketMessages;
        } catch (error) {
            console.error('Failed to get recent messages', error);
            throw error;
        }
    }

    public static async checkingUserExistence(username: string) {
        let user = await User.findOne({ username });
        if (!user) {
            user = new User({ username });
            await user.save();
        }
        return user;
    }

    public static async saveTextMessage(sender: string, text: string) {
        try {
            const timestamp = Date.now();

            const dbMessage = new Message({
                type: MessageFileTypes.TEXT,
                sender,
                text,
                timestamp,
            });

            await dbMessage.save();
            return dbMessage;
        } catch (error) {
            console.error('Failed to save text message:', error);
            throw error;
        }
    }

    public static async saveFileMessage(sender: string, file: IFileData) {
        try {
            const timestamp = Date.now();

            const dbMessage = new Message({
                type: MessageFileTypes.FILE,
                sender,
                fileData: file.data,
                fileName: file.name,
                mimeType: file.type,
                fileSize: file.size,
                timestamp,
            });

            await dbMessage.save();
            return dbMessage;
        } catch (error) {
            console.error('Failed to save audio message:', error);
            throw error;
        }
    }

    public static async setUserOnline(username: string): Promise<void> {
        console.log('Setting user online in DB:', username);

        try {
            const user = await User.findOneAndUpdate(
                { username },
                {
                    isOnline: true,
                },
                {
                    new: true,
                }
            );

            if (!user) {
                throw new Error(`User ${username} not found`);
            }
        } catch (error) {
            console.error('Failed to set user online status', error);
            throw error;
        }
    }

    public static async setUserOffline(username: string): Promise<void> {
        try {
            console.log('Setting user offline in DB:', username);
            const user = await User.findOneAndUpdate(
                { username },
                {
                    isOnline: false,
                },
                {
                    new: true,
                }
            );

            console.log('User update result:', user);

            if (!user) {
                throw new Error(`User ${username} not found`);
            }
        } catch (error) {
            console.error('Failed to set user offline status', error);
            throw error;
        }
    }

    public static async getAllUsersData(): Promise<IUser[]> {
        try {
            const users = await User.find();

            return users.map((user) => ({
                id: user._id.toString(),
                username: user.username,
                isOnline: user.isOnline,
            }));
        } catch (error) {
            console.error('Failed to get user status', error);
            throw error;
        }
    }

    public static async searchMessages(
        query: string,
        limit?: number
    ): Promise<IMessage[]> {
        try {
            const foundMessages = await Message.find({
                $or: [
                    { text: { $regex: query, $options: 'i' } },
                    { fileName: { $regex: query, $options: 'i' } },
                ],
            })
                .sort({ timestamp: -1 })
                .limit(limit || 50);

            return foundMessages;
        } catch (error: any) {
            console.error('Failed to search messages:', error);
            return [];
        }
    }
}

import { Message } from '../../models/Message';
import { IUser } from '../../models/User';
import { User } from '../../models/User';

export class DataBaseAPI {
  public static async getRecentMessages(limit: number = 50) {
    const dbMessages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(limit);
    const websocketMessages = dbMessages.map((dbMessage) => ({
      id: dbMessage._id.toString(),
      username: dbMessage.sender,
      text: dbMessage.text,
      timestamp: dbMessage.timestamp,
    }));
    return websocketMessages;
  }

  public static async getOrCreateUser(username: string) {
    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
      await user.save();
    }
    return user;
  }

  public static async saveMessage(sender: string, text: string) {
    try {
      const dbMessage = new Message({
        sender,
        text,
      });
      await dbMessage.save();
      return dbMessage;
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  }

  public static async setUserOnline(username: string): Promise<IUser> {
    console.log('Setting user online in DB:', username);
    try {
      const user = await User.findOneAndUpdate(
        { username: username },
        {
          username: username,
          isOnline: true,
        },
        {
          upsert: true,
          new: true,
        }
      );

      console.log('User online result:', user?.username, user?.isOnline);
      return user;
    } catch (error) {
      console.error('Failed to set user online status', error);
      throw error;
    }
  }

  public static async setUserOffline(username: string): Promise<IUser> {
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

      return user;
    } catch (error) {
      console.error('Failed to set user offline status', error);
      throw error;
    }
  }

  public static async getOnlineUsers(): Promise<string[]> {
    try {
      const users = await User.find({ isOnline: true }).select('username');
      const usernames = users.map((user) => user.username);

      return usernames;
    } catch (error) {
      console.error('Failed to get online users', error);
      throw error;
    }
  }
}

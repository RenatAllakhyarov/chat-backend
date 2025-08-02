import { Message } from '../../models/Message';
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
      timestamp: dbMessage.timestamp.toLocaleString('ru-RU'),
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
      const dbMessage = new Message({ sender, text, timestamp: new Date() });
      await dbMessage.save();
      return dbMessage;
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  }
}

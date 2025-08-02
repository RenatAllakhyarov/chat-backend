import { Message } from '../../models/Message';

export class getMessages {
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
}

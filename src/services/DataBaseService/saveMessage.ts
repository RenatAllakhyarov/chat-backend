import { Message } from '../../models/Message';

export class saveMessage {
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

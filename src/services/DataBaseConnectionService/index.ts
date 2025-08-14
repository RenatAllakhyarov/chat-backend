import mongoose from 'mongoose';

export class DataBaseConnection {
  private isDbConnected: boolean;

  constructor() {
    this.isDbConnected = false;
  }

  public async connectMongodb() {
    try {
      const dbUrl = process.env.MONGODB_URL;

      if (!dbUrl) {
        throw new Error('MONGODB_URL environment variable is not defined');
      }

      await mongoose.connect(dbUrl);

      this.isDbConnected = true;
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
    }
  }
  public getIsDbConnected(): boolean {
    return this.isDbConnected;
  }
}

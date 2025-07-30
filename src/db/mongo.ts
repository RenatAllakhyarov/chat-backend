import mongoose from 'mongoose';

export let Isdbconnected = false;

export async function connectMongodb() {
  try {
    const dburl = process.env.MONGODB_URL;
    if (!dburl) {
      throw new Error('MONGODB_URL environment variable is not defined');
    }
    await mongoose.connect(dburl);
    Isdbconnected = true;
  } catch (err) {
    Isdbconnected = false;
  }
}

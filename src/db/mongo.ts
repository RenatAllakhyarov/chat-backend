import mongoose from 'mongoose';

export async function connectMongodb() {
  try {
    const dburl = process.env.MONGODB_URL;
    if (!dburl) {
      throw new Error('MONGODB_URL environment variable is not defined');
    }
    console.log('🔌 Подключение к MongoDB...');
    await mongoose.connect(dburl);
    console.log('✅ Успешно подключились к MongoDB');
  } catch (err) {
    console.error('❌ Ошибка подключения к MongoDB:', err);
    process.exit(1);
  }
}

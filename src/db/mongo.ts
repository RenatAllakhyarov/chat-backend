import mongoose from "mongoose";

const MONGO_URL = "mongodb://localhost:27017/practice-chat"; // Измени на свой URL, если нужно

export async function connectMongo() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("✅ MongoDB подключена");
    } catch (err) {
        console.error("❌ Ошибка подключения к MongoDB:", err);
        process.exit(1);
    }
}

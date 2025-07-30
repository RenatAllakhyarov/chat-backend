import mongoose from "mongoose";

const MONGO_URL = "mongodb://localhost:27017/practice-chat"; 

export async function connectMongo() {
    try {
        await mongoose.connect(MONGO_URL);
    } catch (err) {
        process.exit(1);
    }
}

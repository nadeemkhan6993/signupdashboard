import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
    if (isConnected) {
        return;
    }

    if (mongoose.connections[0].readyState) {
        isConnected = true;
        return;
    }

    try {
        // First URL decode, then base64 decode
        const mongodburl = atob(decodeURIComponent(`${process.env.MONGO_URL}`))
        await mongoose.connect(mongodburl!);
        isConnected = true;
        console.log("Database is connected");
    } catch (error) {
        console.log("Database connection error:", error);
        throw error;
    }
}
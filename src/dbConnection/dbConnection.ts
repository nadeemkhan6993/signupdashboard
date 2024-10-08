import mongoose from "mongoose";

export async function connectDB() {
    try {
        const mongodburl = decodeURIComponent(atob(`${process.env.MONGO_URL}`))
        mongoose.connect(mongodburl!)
        const connection = mongoose.connection

        connection.on('connected', () => {
            console.log("Database i connected")
        })
        
        connection.on('error', (error) => {
            console.log("Database connection error : " + error);
            process.exit()
        })

    } catch (error) {
        console.log(error)
        console.log("Not able to connect to DataBase")
    }
}
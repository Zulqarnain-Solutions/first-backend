import mongoose from "mongoose";
import DB_NAME from '../constants.js';


const connectDB = async () => {
    try {
        // console.log( mongoose.connect(`${process.env.DB_URL}`));
        const connectionInstance = await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
        console.log(`Mongo connected DB host:  ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("CONNECTION FAILED IN DB FIle", error)
        process.exit(1)
    }
}

export default connectDB;
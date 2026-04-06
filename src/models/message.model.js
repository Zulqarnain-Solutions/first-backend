import mongoose, { Schema } from "mongoose";

const messageSchema = new mongoose.Schema({
    userName: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    phoneNumber: {
        type: Number,
        require: true
    },
    message: {
        type: String,
        require: true
    }
},
{
    timestamps:true
})

export const Message = mongoose.model("Message", messageSchema);
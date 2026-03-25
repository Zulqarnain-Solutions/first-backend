import mongoose, { mongo, Schema } from "mongoose";
import { User } from "./user.model";

const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,   //// we can get details about file or videos from cloudnary
        required: true
    },
    thumbnail: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref : User
    }
},
{
    timestamps: true
})

export const Video = mongoose.model("Video", videoSchema)
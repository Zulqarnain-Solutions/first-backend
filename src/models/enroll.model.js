import mongoose, { Schema } from "mongoose";
import { Course } from "./course.model.js";
import { User } from "./user.model.js";

const enrollSchema = new mongoose.Schema({
    user:{
        type: mongoose.Types.ObjectId,
        ref: User
    },

    course: {
        type: mongoose.Types.ObjectId,
        ref: Course
    },

    courseFeeAtEnrollment: {
        type: Number,
        required: true
    },

    finalFee: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: [
        "pending",
        "active",
        "inactive",
        "completed",
        "dropped"
        ],
        default: "pending",
    }
},
{
    timestamps:true
}
)

export const Enroll = mongoose.model("Enroll", enrollSchema)
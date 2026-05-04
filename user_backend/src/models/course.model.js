import mongoose, { Schema } from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true,
        lowercase: true,
        unique: true
    },
    description: {
        type: String,
        require: true,
    },
    price: {
        type: String,
        require: true,
    },
    level: {
        type: String,
        require: true
    },
    thumbnail: {
        type: String
    }

})

export const Course = mongoose.model("Course" , courseSchema);
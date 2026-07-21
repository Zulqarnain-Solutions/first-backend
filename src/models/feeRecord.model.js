import mongoose from "mongoose";
import { Enroll } from "./enroll.model.js"

const feeRecordSchema = new mongoose.Schema(
{
    enroll: {
        type: mongoose.Types.ObjectId,
        ref: "Enroll",
        required: true
    },

    // for monthly system (Jan 2026, Feb 2026 etc.)
    month: {
        type: String,
        required: true
    },

    amountDue: {
        type: Number,
        required: true
    },

    amountPaid: {
        type: Number,
        default: 0
    },

    remainingAmount: {
        type: Number,
    },

    status: {
        type: String,
        enum: ["unpaid", "partial", "paid"],
        default: "unpaid"
    },

    dueDate: {
        type: Date,
        required: true
    },

},
{
    timestamps: true
});

export const FeeRecord = mongoose.model("FeeRecord", feeRecordSchema)

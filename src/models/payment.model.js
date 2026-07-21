import mongoose from "mongoose";
import { Enroll } from "./enroll.model.js";
import { FeeRecord } from "./feeRecord.model.js";

const paymentSchema = new mongoose.Schema(
{
    enroll: {
        type: mongoose.Types.ObjectId,
        ref: "Enroll",
        required: true
    },

    feeRecord: {
        type: mongoose.Types.ObjectId,
        ref: "FeeRecord",
        default: null
    },

    amount: {
        type: Number,
        required: true
    },

    paymentMethod: {
        type: String,
        enum: ["cash", "bank", "online"],
        default: "cash"
    },

    receivedBy: {
        type: String,
        default: null
    },

},
{
    timestamps: true
});



export const Payment = mongoose.model("Payment", paymentSchema)
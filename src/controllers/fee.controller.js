import { FeeRecord } from "../models/feeRecord.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getFeeRecords = asyncHandler (async (req, res) => {


    // ============================================
    // STEP 1 — Fetch all fee records from database
    //
    // We populate:
    // - enroll document
    // - user details from enrollment
    // - course details from enrollment
    //
    // This returns complete fee information
    // in a single API call.
    // ============================================

    const feeRecords = await FeeRecord.find()

        .populate({
            path: "enroll",
            populate: [
                {
                    path: "user",
                    select: "userName email"
                },
                {
                    path: "course",
                    select: "title"
                }
            ]
        });

    // ============================================
    // STEP 2 — Check if fee records exist
    //
    // If no records are found, return 404
    // ============================================


    if (!feeRecords || feeRecords.length === 0) {
        throw new ApiError(404, "No fee records found");
    }

    // ============================================
    // STEP 3 — Send successful response
    //
    // Return all fee records to frontend
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            feeRecords,
            "Fee records fetched successfully"
        )
    );

});


/// Pay fee 
const payFee = asyncHandler(async (req, res) => {

    // ============================================
    // STEP 1 — Get fee record ID and payment amount
    // from frontend request
    //
    // Example:
    // req.body.id
    // req.body.amountPaid
    // ============================================

    const { feeRecordId, amount, paymentMethod, feeMonth } = req.body;

    // ============================================
    // STEP 2 — Validate required fields
    // ============================================

    console.log(feeRecordId)
    if (!feeRecordId) {
        throw new ApiError(400, "Fee record ID is required");
    }

    if (amount === undefined || amount === null || !feeMonth) {
        throw new ApiError(400, "Payment amount and fee month is required");
    }

    // ============================================
    // STEP 3 — Find fee record
    //
    // If record does not exist,
    // stop execution
    // ============================================

    const feeRecord = await FeeRecord.findById(feeRecordId);

    if (!feeRecord) {
        throw new ApiError(404, "Fee record not found");
    }

    // ============================================
    // STEP 4 — Validate payment amount
    //
    // Payment amount should be greater than zero
    // ============================================

    if (amount <= 0) {
        throw new ApiError(400, "Payment amount must be greater than zero");
    }

    // ============================================
    // STEP 5 — Prevent overpayment
    //
    // User cannot pay more than the
    // remaining amount
    // ============================================

    if (amount > feeRecord.remainingAmount) {
        throw new ApiError(
            400,
            "Payment amount cannot be greater than remaining amount"
        );
    }

    // ============================================
    // STEP 6 — Update payment details
    //
    // Increase total paid amount
    // Calculate remaining balance
    // ============================================

    feeRecord.amountPaid += Number(amount);

    feeRecord.remainingAmount =
        feeRecord.amountDue - amount;

        console.log(feeRecord.remainingAmount);

    // ============================================
    // STEP 7 — Update fee status
    //
    // unpaid  -> no payment
    // partial -> some payment
    // paid    -> full payment
    // ============================================

    if (feeRecord.amountPaid === 0) {
        feeRecord.status = "unpaid";
    }
    else if (feeRecord.remainingAmount === 0) {
        feeRecord.status = "paid";
    }
    else {
        feeRecord.status = "partial";
    }

    // ============================================
    // STEP 8 — Save updated fee record
    // ============================================

    await feeRecord.save();

    // ============================================
    // STEP 9 — Fetch updated fee record
    //
    // Populate enrollment, student and
    // course information for frontend
    // ============================================

    const updatedFeeRecord = await FeeRecord.findById(feeRecord._id)
        .populate({
            path: "enroll",
            populate: [
                {
                    path: "user",
                    select: "name email"
                },
                {
                    path: "course",
                    select: "title"
                }
            ]
        });

    // ============================================
    // STEP 10 — Return success response
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedFeeRecord,
            "Fee paid successfully"
        )
    );

});

export {
    getFeeRecords,
    payFee,
}
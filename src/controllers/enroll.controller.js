import { Enroll } from "../models/enroll.model.js";
import { FeeRecord } from "../models/feeRecord.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const enroll = asyncHandler( async (req, res) => {

    // Get User from middleware or looged in user 
    const user  = req.user;
    console.log(user.userName)


    // Get Course ID from user 
    const { userName, email, courseId, courseFeeAtEnrollment, finalFee } = req.body;
    console.log(req.body);

    // Check user already exist or not 
    const existUser = await User.findOne({
        $or: [ { email } ]
    })

    // If user exist throw error
    if(existUser){
        throw new ApiError (409, "User already exist")
    }

    /// store user data
    let createdUser;

    if( user.userName === 'admin'){

        // before enrollment create user first
        createdUser = await User.create({
            userName : userName.toLowerCase(), 
            email,
            password: '12345',
        })
        // Check for user creation
        if(!createdUser){
            throw new ApiError( 500 , "Internal server error ! ");
        }
    }

    // Throw error if course data is missing
    if (!courseId) {
        throw new ApiError(401, "Course must required! Course is misssing")
    }

    // Throw error if not user
    if(!( createdUser || user ) ) {
        throw new ApiError(401, "User data Manduntary while course enrollment")
    }

    // Create user enrollment
    const enroll = await Enroll.create({
        user : createdUser._id || user._id,
        course: courseId,
        status: "pending",
        courseFeeAtEnrollment,
        finalFee
    })

    // get month
    const month = new Date().toLocaleString("en-US", {
    month: "long",
    });

    // Get due date
    const date = new Date();
    date.setDate(date.getDate() + 8);
    const dueDate = date.toISOString().split("T")[0];

    const feeRecord = await FeeRecord.create({
        enroll: enroll._id,
        month,
        amountDue: enroll.finalFee,
        remainingAmount: enroll.finalFee,
        dueDate
    })

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            enroll,
            "Successfully enroll"
        )
    )

})

const getStudentsByStatus = asyncHandler(async (req, res) => {

    // ============================================
    // STEP 1 — Get status from frontend request
    // Example:
    // /api/enroll/students?status=active
    // ============================================

    const { status } = req.query;

    // ============================================
    // STEP 2 — Check if status exists
    // ============================================

    // if (!status) {
    //     throw new ApiError(400, "Status is required!");
    // }

    let filter = {};

    if (status && status !== "all") {
        filter.status = status;
    }

    // ============================================
    // STEP 3 — Find enrollments by status
    // ============================================


    const students = await Enroll.find( filter )

    // ============================================
    // STEP 4 — Populate user data
    // Replace user ID with actual user information
    // ============================================

    .populate("user")

    // ============================================
    // STEP 5 — Populate course data
    // Replace course ID with actual course info
    // ============================================

    .populate("course", "title")

    // ============================================
    // STEP 6 — Check if students found
    // ============================================

    if (!students || students.length === 0) {
        throw new ApiError(404, `No students found`);
    }

    // ============================================
    // STEP 7 — Response message
    // ============================================

    const message = status
    ? `${status} students fetched successfully`
    : "All students fetched successfully";

    // ============================================
    // STEP 8 — Send response
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            students,
            message
        )
    );

});

const deleteEnrollment = asyncHandler(async (req, res) => {

    console.log("deleting...")

    // ============================================
    // STEP 1 — Get enrollment ID from frontend request
    // Example:
    // req.body.id
    // ============================================

    const { id } = req.body;

    // ============================================
    // STEP 2 — Validate enrollment ID
    // If ID is missing, stop execution
    // ============================================

    if (!id) {
        throw new ApiError(400, "Enrollment ID is required!");
    }

    // ============================================
    // STEP 3 — Check if enrollment exists
    // This prevents deleting non-existing records
    // ============================================

    const enrollment = await Enroll.findById(id);

    if (!enrollment) {
        throw new ApiError(404, "Enrollment not found!");
    }

    // ============================================
    // STEP 4 — Delete enrollment from database
    // Using findByIdAndDelete for clean deletion
    // ============================================

    await Enroll.findByIdAndDelete(id);

    // ============================================
    // STEP 5 — Send success response
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Enrollment deleted successfully"
        )
    );

});

const updateEnrollment = asyncHandler(async (req, res) => {

    // ============================================
    // STEP 1 — Get enrollment ID and fields
    // from frontend request body
    //
    // Example:
    // req.body.id
    // req.body.status
    // req.body.paymentStatus
    // ============================================

    const {
        id,
        status,
        paymentStatus
    } = req.body;

    // ============================================
    // STEP 2 — Validate enrollment ID
    // ============================================

    if (!id) {
        throw new ApiError(400, "Enrollment ID is required!");
    }

    // ============================================
    // STEP 3 — Check if enrollment exists
    // Prevent updating non-existing enrollment
    // ============================================

    const existingEnrollment = await Enroll.findById(id);

    if (!existingEnrollment) {
        throw new ApiError(404, "Enrollment not found!");
    }

    // ============================================
    // STEP 4 — Create update object dynamically
    //
    // Only update fields that are provided
    // This prevents overwriting existing values
    // with undefined
    // ============================================

    const updateFields = {};

    if (status) {
        updateFields.status = status;
    }

    if (paymentStatus) {
        updateFields.paymentStatus = paymentStatus;
    }

    // ============================================
    // STEP 5 — Update enrollment using
    // findByIdAndUpdate
    //
    // new: true
    // → returns updated document
    //
    // runValidators: true
    // → ensures schema validation runs
    // ============================================

    const updatedEnrollment = await Enroll.findByIdAndUpdate(
        id,
        {
            $set: updateFields
        },
        {
            new: true,
            // runValidators: true
        }
    )

    // ============================================
    // STEP 6 — Send success response
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedEnrollment,
            "Enrollment updated successfully"
        )
    );

});

export {
    enroll,
    getStudentsByStatus,
    updateEnrollment,
    deleteEnrollment
}
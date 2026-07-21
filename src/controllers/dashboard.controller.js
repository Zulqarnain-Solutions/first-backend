import { Course } from "../models/course.model.js";
import { Enroll } from "../models/enroll.model.js";
import { FeeRecord } from "../models/feeRecord.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js"

const getDashboardData = asyncHandler(async (req, res) => {

console.log("DAs")
// ==========================================================
// ALGORITHM
// ==========================================================
//
// Step 1: Count the total number of enrolled students.
//
// Step 2: Count the total number of available courses.
//
// Step 3: Calculate the total pending fee by summing all
//         remaining fee amounts.
//
// Step 4: Calculate the total collected fee by summing all
//         paid fee amounts.
//
// Step 5: Aggregate enrollment data to calculate the number
//         of students enrolled in each course.
//
// Step 6: Fetch the latest enrolled students for the
//         Recent Enrollments section.
//
// Step 7: Fetch the latest fee payment records for the
//         Recent Fee Payments section.
//
// Step 8: Combine all collected statistics, chart data,
//         and recent activities into a single dashboard
//         response object.
//
// Step 9: Return the dashboard data as the API response.
// ====================================================

    // ============================================
    // STEP 1 — Get total enrolled students
    //
    // Count all enrollment documents
    // ============================================

    const totalStudents = await Enroll.countDocuments();

    // ============================================
    // STEP 2 — Get total courses
    //
    // Count all available courses
    // ============================================

    const totalCourses = await Course.countDocuments();

    // ============================================
    // STEP 3 — Calculate total pending fee
    //
    // Sum remainingAmount from every fee record
    //
    // Example:
    // Student A Remaining = 2000
    // Student B Remaining = 1500
    // Total Pending = 3500
    // ============================================

    const pendingFee = await FeeRecord.aggregate([
        {
            $group: {
                _id: null,
                totalPendingFee: {
                    $sum: "$remainingAmount"
                }
            }
        }
    ]);

    // ============================================
    // STEP 4 — Calculate total paid fee
    //
    // Sum amountPaid from every fee record
    // ============================================

    const paidFee = await FeeRecord.aggregate([
        {
            $group: {
                _id: null,
                totalPaidFee: {
                    $sum: "$amountPaid"
                }
            }
        }
    ]);

    // ============================================
    // STEP 5 — Get student count for each course
    //
    // This data will be used for dashboard chart
    //
    // Result Example:
    // [
    //   { courseName: "Web Development", totalStudents: 35 },
    //   { courseName: "Programming", totalStudents: 18 }
    // ]
    // ============================================

    const studentsPerCourse = await Enroll.aggregate([

        // Join Course collection
        {
            $lookup: {
                from: "courses",
                localField: "course",
                foreignField: "_id",
                as: "course"
            }
        },

        // Convert course array into object
        {
            $unwind: "$course"
        },

        // Group by course title
        {
            $group: {
                _id: "$course.title",
                totalStudents: {
                    $sum: 1
                }
            }
        },

        // Rename fields
        {
            $project: {
                _id: 0,
                courseName: "$_id",
                totalStudents: 1
            }
        },

        // Sort alphabetically
        {
            $sort: {
                courseName: 1
            }
        }

    ]);

    // ============================================
    // STEP 6 — Get recent enrollments
    //
    // Latest students enrolled
    // ============================================

    const recentEnrollments = await Enroll.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "userName")
        .populate("course", "title");

    // ============================================
    // STEP 7 — Get recent fee payments
    //
    // Latest fee updates
    // ============================================

    const recentFeePayments = await FeeRecord.find({
        amountPaid: { $gt: 0 }
    })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate({
            path: "enroll",
            populate: [
                {
                    path: "user",
                    select: "userName"
                },
                {
                    path: "course",
                    select: "title"
                }
            ]
        });

    // ============================================
    // STEP 8 — Prepare dashboard response
    // ============================================

    const dashboardData = {

        // Dashboard Cards
        totalStudents,
        totalCourses,
        totalPendingFee:
            pendingFee.length > 0
                ? pendingFee[0].totalPendingFee
                : 0,

        totalPaidFee:
            paidFee.length > 0
                ? paidFee[0].totalPaidFee
                : 0,

        // Dashboard Chart
        studentsPerCourse,

        // Dashboard Recent Activities
        recentActivities: {
            enrollments: recentEnrollments,
            feePayments: recentFeePayments
        }

    };

    // ============================================
    // STEP 9 — Return dashboard data
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            dashboardData,
            "Dashboard data fetched successfully"
        )
    );

});

export {
    getDashboardData
}
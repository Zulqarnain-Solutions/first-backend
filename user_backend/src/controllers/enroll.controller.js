import { Enroll } from "../models/enroll.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const enroll = asyncHandler( async (req, res) => {

    // Get Course ID from user 
    const { courseId } = req.body;

    // Get User from middleware or looged in user 
    const user  = req.user;
    // console.log(user, req.user)

    // Throw error if course data is missing
    if (!courseId) {
        throw new ApiError(401, "Course must required! Course is misssing")
    }

    // Throw error if not user
    if(!user) {
        throw new ApiError(401, "User data Manduntary while course enrollment")
    }

    // Create user enrollment
    const enroll = Enroll.create({
        user : user._id,
        course: courseId
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

export {
    enroll,
}
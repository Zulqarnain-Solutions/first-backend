import { Course } from "../models/course.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js"
import uploadOnCloudinary from "../utils/cloudinary.js";

const addCourse = asyncHandler ( async (req, res) => {

    const { title, description, price, level, thumbnail, instructor } = req.body;

    if ( !title || !description || !price || !level ){
        throw new ApiError(401, "All Fields are requires");
    }

    console.log(req.file?.path)
    const thumbnailLocalPath = req.file?.path;  

    if ( !thumbnailLocalPath ){
        throw new ApiError( 401, "Something went wrong while uploading thumbnail")
    }

    // console.log(thumbnailLocalPath)

    const cloudinaryThumbnailPath = await uploadOnCloudinary(thumbnailLocalPath);

    const course = await Course.create({
        title,
        description,
        price,
        level,
        thumbnail : cloudinaryThumbnailPath?.url || "",
        instructor

    })

    return res.status(200)
    .json(
        new ApiResponse (
            200,
            course,
            "Register course successfullu"
        )
    )
})

const getCourses = asyncHandler ( async (req, res) => {

    const courses = await Course.find();

    return res.status(200)
    .json( 
        new ApiResponse(
            200,
            courses,
            "All ok"
        )
    )
})

const deleteCourse = asyncHandler(async (req, res) => {
    /*
        STEP 1:
        Get course ID from request body
    */
    const { _id } = req.body;

    /*
        STEP 2:
        Validate course ID
        If ID is missing, stop execution
    */
    if (!_id) {
        throw new ApiError(400, "Course ID is required");
    }

    /*
        STEP 3:
        Check if course exists before deleting

        This avoids silent failures and gives
        a proper 404 response if course does not exist
    */
    const course = await Course.findById(_id);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    /*
        STEP 4:
        Delete course from database

        Using findByIdAndDelete keeps code clean
        and avoids unnecessary extra logic
    */
    await Course.findByIdAndDelete(_id);

    /*
        STEP 5:
        Return success response
    */
    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Course deleted successfully"
        )
    );
});


const updateCourse = asyncHandler(async (req, res) => {
    /*
        STEP 1:
        Extract ID and optional fields from request body
    */
    const {
        id,
        title,
        description,
        price,
        level,
        instructor
    } = req.body;

    /*
        STEP 2:
        Validate course ID
    */
    if (!id) {
        throw new ApiError(400, "Course ID is required");
    }

    /*
        STEP 3:
        Check if course exists first

        This helps return proper error handling
        before attempting update operations
    */
    const existingCourse = await Course.findById(id);

    if (!existingCourse) {
        throw new ApiError(404, "Course not found");
    }

    /*
        STEP 4:
        Create update object dynamically

        Only update fields that are provided
        This prevents overwriting existing values with undefined
    */
    const updateFields = {};

    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (price) updateFields.price = price;
    if (level) updateFields.level = level;
    if (instructor) updateFields.instructor = instructor;

    /*
        STEP 5:
        Handle optional thumbnail update

        If new thumbnail is uploaded:
        - Upload to Cloudinary
        - Save new URL in update object

        NOTE:
        In production, you may also want to delete
        old Cloudinary image to reduce storage usage
    */
    const thumbnailLocalPath = req.file?.path;

    if (thumbnailLocalPath) {
        const cloudinaryThumbnailPath = await uploadOnCloudinary(thumbnailLocalPath);

        if (!cloudinaryThumbnailPath?.url) {
            throw new ApiError(
                500,
                "Something went wrong while uploading thumbnail"
            );
        }

        updateFields.thumbnail = cloudinaryThumbnailPath.url;
    }

    /*
        STEP 6:
        Update course using findByIdAndUpdate

        new: true
        → returns updated document

        runValidators: true
        → ensures schema validation still runs

        PERFORMANCE NOTE:
        This is better than save() for direct updates
        because it avoids unnecessary full document operations
    */
    const updatedCourse = await Course.findByIdAndUpdate(
        id,
        {
            $set: updateFields
        },
        {
            new: true
        }
    );

    /*
        STEP 7:
        Return success response with updated data
    */
    return res.status(200).json(
        new ApiResponse(
            200,
            updatedCourse,
            "Course updated successfully"
        )
    );
});


export {
    addCourse,
    getCourses,
    deleteCourse,
    updateCourse
}
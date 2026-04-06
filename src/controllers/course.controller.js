import { Course } from "../models/course.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js"
import uploadOnCloudinary from "../utils/cloudinary.js";

const addCourse = asyncHandler ( async (req, res) => {

    const { title, description, price, level, thumbnail } = req.body;

    if ( !title || !description || !price || !level ){
        throw new ApiError(401, "All Fields are requires");
    }

    const thumbnailLocalPath = req.file?.path;  

    if ( !thumbnailLocalPath ){
        throw new ApiError( 401, "Something went wrong while uploading thumbnail")
    }thumbnailLocalPath

    console.log(thumbnailLocalPath)

    const cloudinaryThumbnailPath = await uploadOnCloudinary(thumbnailLocalPath);

    const course = await Course.create({
        title,
        description,
        price,
        level,
        thumbnail : cloudinaryThumbnailPath?.url || ""

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

export {
    addCourse,
    getCourses
}
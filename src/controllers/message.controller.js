import { Message } from "../models/message.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const addmessage = asyncHandler ( async (req, res) => {

    // Get data from user
    const { userName, email, phoneNumber, message }= req.body;

    // Check all field not empty
    if( !userName || !email || !phoneNumber || !message ){
        throw new ApiError(401, " All fields are required");
    }

    const usermessageData = await Message.create({
         userName, 
         email, 
         phoneNumber, 
         message
    },{ new: true });

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            usermessageData,
            "Successfully send message"
        )
    )
})


export { addmessage }
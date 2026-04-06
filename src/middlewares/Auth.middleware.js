

import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiErrors.js"
import asyncHandler from "../utils/asyncHandler.js"

const verifyJWT = asyncHandler( async (req, _ , next) => {
   try {
     const token = req.cookies?.accessToken ||
     req.header("Authorization")?.replace("Bearer", "");

     if(!token){
        throw new ApiError(401, "Unauthorize Access");
     }
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

     const user = await User.findById(decodedToken?._id);

     if(!user){
        throw new ApiError(401, "Invalid Toke");
     }
   //   console.log(user)
     req.user = user;
     next();
    
   } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access Token")
   }
})

export default verifyJWT ;
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js"
import { User } from "../models/user.model.js";
import  uploadOnCloudinary  from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js"
import cookieParser from "cookie-parser";



// Generate Acces and Refresh Token methods 
const generateAccessAndRefreshTokens  = async (userId) => {
    try {
        const user = await User.findOne(userId);
        console.log(user);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save( { validateBeforeSave: false } );

        return { accessToken, refreshToken }
      
    } catch (error) {
        throw new ApiError(500, " Something went wroung while generating TOkens ")
    }
}

// User Registeration in DB
const userRegister = asyncHandler( async (req, res) => {

    // 1. Get user Data from frotend 
    const { userName,  email,  password } = req.body;

    // FullName
    let fullName = userName;

    // 2. Validate data - not empty
    if ( [ userName, email, password ].some( (field) => field?.trim() === "" ))
        {
            throw new ApiError(400, " All field are requires ")
        }

    // 3. Check user already exist or not 
    const existUser = await User.findOne({
        $or: [ { email }, { userName } ]
    })

    // If user exist throw error
    if(existUser){
        throw new ApiError (409, "User already exist")
    }

    ///  Check for Images - Check for avatar
    //  ....
    //  const avatarLocalPath = req.files?.avatar[0]?.path;
    //  ....
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    /// This optional checking for coverImageLocalPath (optional) will not work 
    // because we expect if user not ulpoad save "" empty or do nothing but this checking
    // give error so 
    // let coverImageLocalPath;
    // // To solve this use core js classic
    // if(req.files && Array.isArray(req.files.coverImage) 
    // && req.files.coverImage.length > 0 )
    // {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

    // Upload media ( Images or Avatar ) on cloudinary 
    // const avatarCloudinaryData = await uploadOnCloudinary(avatarLocalPath);
    // const coverImageCloudinaryData = await uploadOnCloudinary(coverImageLocalPath); 

    // // check avatar is must 
    // if(!avatarCloudinaryData)
    // {
    //     throw new ApiError(400, " Avatar is required ")
    // }

    // avatar : avatarCloudinaryData.url,
    // coverImage: coverImageCloudinaryData?.url || ""
    // Create User Object - create entry in DB
    const user = await User.create({
        userName : userName.toLowerCase(), 
        fullName : fullName,
        email,
        password,
    })
console.log(user)
    // Remove password and Resfresh token field from response
    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // Check for user creation
    if(!user){
        throw new ApiError( 500 , "Internal server error !!!! ");
    }
    // return response
    return res.status(200)
    .json( 
        new ApiResponse(
            200,
            createUser,
            "Successfully Created"
        )
    )
    ;
})

// User Authentication or login logic 
const userLogin = asyncHandler( async (req, res) => {

    console.log(req.body);
    // Get data from user - req.body
    const { userName, email, password } = req.body;

    // Check userName or email field is empty
    if ( !userName && !email ){
        throw new ApiError(400, " userName or email is required ");
    }

    // Find user in DB
    const user = await User.findOne({
        $or: [ { userName }, { email } ]
    })

    // If not user exist in DB throw error 
    if( !user ){
        throw new ApiError(404, " userName not exist ");
    }

    // Check password using provided method in user.model.js is isPasswordCorrect()
    const isPasswordValid = await user.isPasswordCorrect(password)

    if( !isPasswordValid ){
        throw new ApiError(401, " Invalid user credentials ");
    }

    // Generate Access and Refreash Token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id); 
    
    // Get user again because  before that user we got is empty token 
    const loggedInUser = await User.findById( user._id )
    .select( " -password -refreshToken " );

    const options = {
        httpOnly : true,
        secure: true
    }

    // Send cookies and Resturn response
    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
           {
              user: accessToken, refreshToken, loggedInUser
           },
           "User Successfully login"
        )
    )
})


// User logout 
const logout = asyncHandler( async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
            refreshToken: undefined
        }
        },
        {
            new: true
        }
    )

     const options = {
        httpOnly : true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "successfully logot"
        )
    )
})

// When acces token expire so regenerate access and refresh tokens and save to DB  
const regenerateRefreshToken = asyncHandler( async (req, res) => {

   try {
     // Get RefreshToken 
     const incomingRefreshToken = req.cookie?.refreshToken || req.body.refreshToken;
 
     if(!incomingRefreshToken){
         throw new ApiError(401, "Unauhorize request");
     }
 
     // Verify Token with env token
     const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
 
     // Find user from DB 
     const user = await User.findById(decodedToken?._id);
 
     if( !user ){
         throw new ApiError(401, " Invalid Refresh Token")
     }
 
     // Validate incomingToken with user Token saved in DB
     if ( incomingRefreshToken !== user?.refreshToken){
          throw new ApiError(401, " Invalid Refresh Token");
     }
 
     // Generate Tokens 
     const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
 
     const options = {
         httpOnly : true,
         secure: true
     }
 
     return res.status(200)
     .cookie("accessToken" , accessToken , options)
     .cookie("refreshToken" , refreshToken , options)
     .json(
         new ApiResponse(
             200,
            {
               user: accessToken, refreshToken, loggedInUser
            },
            "Successfully refrehed tokens"
         )
     )
 
   } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh tokens")
   }

})

// Changes password
const changeOldPassword = asyncHandler( async (req, res) => {

    // Get Old and New Password 
    const { oldPassword, newPassword } = req.body;

    // Check field is not empty
    if ( !oldPassword || !newPassword ){
        throw new ApiError(400, "All fields are required");
    }

    // Get user 
    const user = await User.findById( req.user?._id )

    // Check user password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    // Check have user 
    if ( !isPasswordCorrect ){
        throw new ApiError(400, "Invalid Password");
    }

    // Assign user password to new password
    user.password = newPassword;
    await user.save( { validateBeforeSave: false } );

    // Return response
    return res.status(200)
    .json(
        new ApiResponse(
            200, 
            {},
            "Successfully changed password"
        )
        )
})

// Update user details fullName or email
const updateAccountDetails = asyncHandler( async (req, res) =>{

    // Get data = req.body
    const { userName, email } = req.body;

    let fullName = userName;

    // Check fields are not empty
    if ( !userName && !email ){
        throw new ApiError(400, "All fields are required")
    }

    // const avatarLocalPath = req.files?.avatar[0]?.path;
    let avatarLocalPath;
    // // To solve this use core js classic
    if(req.files && Array.isArray(req.files?.avatar) 
    && req.files?.avatar.length > 0 )
    {
        avatarLocalPath = req.files?.avatar[0]?.path;
        console.log(req.files.avatar[0].path);
    }

     // Upload media ( Images or Avatar ) on cloudinary 
    const avatarCloudinaryData = await uploadOnCloudinary(avatarLocalPath);

    // Get user from DB using query and update and 
    // return newly saved data and
    //  remove password while return 

// req.user?._id
    const user = await User.findOneAndUpdate(
        req.user._id,
        {
            $set: {
                userName,
                fullName,
                email,
                avatar: avatarCloudinaryData?.url || ""
            }
        },
        {
            new: true
        }
    ).select( "-password" );  
    
    console.log(user);
    // Return response
    return res.status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Successfully update changes"
        )
    )

})

// Update avatar 
const updateAvatar = asyncHandler( async (req, res) =>{

    // Get avatar path - req.file - file possible using multer middleware
    const avatarLocalPath = req.file?.path;

    // Check avatar is missing
    if ( !avatarLocalPath ){
        throw new ApiError(400, " Avatar is missing ");
    }

    // Upload on cloudinary and receive response from cloudinary {}
    const avatarCloudinaryData = await uploadOnCloudinary(avatarLocalPath);

    // Check file uploaded or nor on cloudinary
    if ( !avatarCloudinaryData.url ){
        throw new ApiError(400, " Error while uploading avatar on cloudinary ");
    }

    // Now update avatar in DB using update and return newly data 
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar : avatarCloudinaryData.url
            }
        },
        {
            new: true
        }
    ).select( "-password" );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Successfully changed avatar"
        )
    )


})

// Update cover image
const updateCoverImage = asyncHandler( async (req, res) =>{

    // Get avatar path - req.file - file possible using multer middleware
    const coverImageLocalPath = req.file?.path;

    // Check avatar is missing
    if ( !coverImageLocalPath ){
        throw new ApiError(400, " Avatar is missing ");
    }

    // Upload on cloudinary and receive response from cloudinary {}
    const coverImageCloudinaryData = await uploadOnCloudinary(coverImageLocalPath);

    // Check file uploaded or nor on cloudinary
    if ( !coverImageCloudinaryData.url ){
        throw new ApiError(400, " Error while uploading cover image on cloudinary ");
    }

    // Now update avatar in DB using update and return newly data 
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar : coverImageCloudinaryData.url
            }
        },
        {
            new: true
        }
    ).select( "-password" );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Successfully changed avatar"
        )
    )


})

// we will verify user data that user logged in or not 
const verifyUserLoggedIn = asyncHandler( async (req, res) => {
    console.log("HELOOO!!");
    // console.log( req.user);
    const user = await User.findByIdAndUpdate( 
        req.user._id
     )
     .select( "-password -refreshToken")
     ;

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "successfully Verify User"
        )
    )
})


export { 
    userRegister, 
    userLogin, 
    logout, 
    regenerateRefreshToken,
    changeOldPassword,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    verifyUserLoggedIn
};



















// import { useState } from "react";

// export default function Profile() {
//   const [formData, setFormData] = useState({
//     userName: "John Doe",
//     email: "john@example.com",
//     bio: "Frontend developer passionate about React."
//   });

//   const [isEditing, setIsEditing] = useState(false);

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("Updated Data:", formData);
//     setIsEditing(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 py-10 px-4">
//       <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden">

//         {/* Header */}
//         <div className="bg-indigo-600 h-32 relative">
//           <div className="absolute -bottom-12 left-6">
//             <img
//               src="https://i.pravatar.cc/150"
//               alt="avatar"
//               className="w-24 h-24 rounded-full border-4 border-white object-cover"
//             />
//           </div>
//         </div>

//         {/* Content */}
//         <div className="pt-16 pb-8 px-6">
//           <div className="flex justify-between items-center mb-6">
//             <div>
//               <h2 className="text-xl font-semibold text-gray-800">
//                 {formData.userName}
//               </h2>
//               <p className="text-gray-500 text-sm">{formData.email}</p>
//             </div>

//             <button
//               onClick={() => setIsEditing(!isEditing)}
//               className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
//             >
//               {isEditing ? "Cancel" : "Edit Profile"}
//             </button>
//           </div>

//           {/* Form */}
//           <form onSubmit={handleSubmit} className="space-y-4">
            
//             {/* Username */}
//             <div>
//               <label className="block text-sm text-gray-600 mb-1">
//                 Username
//               </label>
//               <input
//                 type="text"
//                 name="userName"
//                 value={formData.userName}
//                 onChange={handleChange}
//                 disabled={!isEditing}
//                 className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
//               />
//             </div>

//             {/* Email */}
//             <div>
//               <label className="block text-sm text-gray-600 mb-1">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 disabled={!isEditing}
//                 className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
//               />
//             </div>

//             {/* Bio */}
//             <div>
//               <label className="block text-sm text-gray-600 mb-1">
//                 Bio
//               </label>
//               <textarea
//                 name="bio"
//                 value={formData.bio}
//                 onChange={handleChange}
//                 disabled={!isEditing}
//                 rows="3"
//                 className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
//               />
//             </div>

//             {/* Save Button */}
//             {isEditing && (
//               <div className="flex justify-end">
//                 <button
//                   type="submit"
//                   className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
//                 >
//                   Save Changes
//                 </button>
//               </div>
//             )}
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
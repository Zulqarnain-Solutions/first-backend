// import { cloudinary } from "cloudinary";
import dotenv from 'dotenv';
dotenv.config()

import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';

// Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME , 
        api_key: process.env.CLOUDINARY_KEY , 
        api_secret: process.env.CLOUDINARY_SECRET 
    });

// Upload an image
     const uploadOnCloudinary = async (localFilePath) => {
      
        try{
            if(!localFilePath) return null;
    
            const reponse = await cloudinary.uploader.upload(
            localFilePath , 
            {
              resource_type: "auto",
            })
            // console.log("Upload on cloud");
            fs.unlinkSync(localFilePath);
            return reponse;
        }
        catch(err) {
              console.log(" avatarLocalPath in cloudinary in catch:::" , err);
            fs.unlinkSync(localFilePath);
            return null;
        }
    }

    export default uploadOnCloudinary ;
    
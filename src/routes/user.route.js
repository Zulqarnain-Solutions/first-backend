import { Router } from "express";
import { userRegister, userLogin, logout, regenerateRefreshToken, verifyUserLoggedIn, updateAccountDetails  } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/Auth.middleware.js";

// import { userLogin } from "../controllers/user.controller.js";

const router = Router();

router.route("/updateAccountDetails").post(
    upload.fields([
        {name: "avatar", maxCount: 1},
        {name: "coverImage", maxCount: 1}
    ]),
    verifyJWT,
    updateAccountDetails)
router.route("/register").post(userRegister)

router.route("/login").post( userLogin )
router.route("/verifyUserLoggedIn").get(verifyJWT, verifyUserLoggedIn)
router.route("/logout").get( verifyJWT, logout )
router.route("/refresh-tokens").post( regenerateRefreshToken )

export { router }

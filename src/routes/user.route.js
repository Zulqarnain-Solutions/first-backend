import { Router } from "express";
import { userRegister, userLogin, logout, regenerateRefreshToken, verifyUserLoggedIn, updateAccountDetails  } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/Auth.middleware.js";
import { addCourse, deleteCourse, getCourses } from "../controllers/course.controller.js";
import { deleteEnrollment, enroll, getStudentsByStatus } from "../controllers/enroll.controller.js";
import { addmessage } from "../controllers/message.controller.js";
import { getFeeRecords, payFee } from "../controllers/fee.controller.js";
import { getDashboardData } from "../controllers/dashboard.controller.js";

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



// Course Route
// upload.single('thumbnail')
router.route("/addCourse").post( upload.single('thumbnail'), addCourse)
router.route("/getCourses").get(getCourses);
router.route("/deleteCourse").post(deleteCourse);



// Entrollment Routes
router.route("/Enrollment").post(verifyJWT, enroll);
router.route("/students").get(getStudentsByStatus);
router.route("/deleteEnrollment").post(deleteEnrollment); 

// Fee Routes
router.route("/feerecords").get( getFeeRecords );
router.route("/payfee").post( payFee );

// Contact
router.route("/addmessage").post(addmessage);

// Dashboard
router.route("/data").get(getDashboardData);

export { router }












// POST /forgot-password → send OTP
// POST /verify-otp → verify OTP
// POST /reset-password → update password
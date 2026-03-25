import express from 'express'
import cors from 'cors'
import cookieParser from "cookie-parser";

const app = express()
app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true
}))

// Middlewares
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded ( {extended: true, limit: "16kb"}) )
app.use(express.static("public"))
app.use(cookieParser());


// Router import
import { router as UserRouter } from './routes/user.route.js'
import { errorHandler } from './middlewares/errorHandler.js';

// Routes 
app.use("/api/v1/users", UserRouter )

app.use(errorHandler);

export default app;
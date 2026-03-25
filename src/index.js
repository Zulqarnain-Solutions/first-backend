import dotenv from 'dotenv';
import connectDB from './db/db.js'
import app from './app.js';

dotenv.config()

const port = process.env.PORT || 8000;

connectDB()
.then( () => {
    app.listen( port, () => {
        console.log(`SERVER IS RUNNING AT PORT ${port} `)
    })
})
.catch( (err) => {
    console.log("MONGODB NOT CONNECTED !!!!" , err);
} )
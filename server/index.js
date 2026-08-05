import express from 'express';
import cookieParser from 'cookie-parser';
import dbConnection from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import sessionRoutes from './src/routes/sessionRoutes.js';
import interviewRoutes from './src/routes/interviewRoutes.js';
import resultRoutes from './src/routes/resultRoutes.js';
import dotenv from 'dotenv';
dotenv.config();


const app= express();

//middlewares
app.use(express.json());
app.use(cookieParser());   // must come before any route using req.cookies


//Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/session', sessionRoutes);
app.use('/api/v1/interview', interviewRoutes);
app.use('/api/v1/result', resultRoutes);






const PORT= process.env.PORT || 4001 ;

dbConnection();
app.listen(PORT, ()=>{
    console.log(`The server is started at PORT:${PORT}`);
})
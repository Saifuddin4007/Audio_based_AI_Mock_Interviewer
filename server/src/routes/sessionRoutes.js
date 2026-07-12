import express from 'express';
import { auth } from '../middlewares/auth';
import { createSession } from '../controllers/sessionControllers';


const router= express.Router();



router.post('/', auth, createSession);

export default router;
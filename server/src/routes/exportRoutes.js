import express from 'express';
import { downloadInterviewResult } from '../controllers/exportControllers.js';
import { auth } from '../middlewares/auth.js';




const router= express.Router();

router.get('/:sessionId/download', auth , downloadInterviewResult);

export default router;

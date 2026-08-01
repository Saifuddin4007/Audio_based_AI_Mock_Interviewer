import express from 'express';
import { abandonInterview, startInterview, submitAnswerAndNext } from '../controllers/interviewController.js';
import { auth } from '../middlewares/auth.js';

const router= express.Router();

router.post('/start', auth, startInterview);

router.post('/submit', auth, submitAnswerAndNext);

router.post('/abandon', auth, abandonInterview);


export default router;
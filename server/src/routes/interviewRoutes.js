import express from 'express';
import { abandonInterview, startInterview, submitAnswerAndNext } from '../controllers/interviewController';

const router= express.Router();

router.post('/start', startInterview);

router.post('/submit', submitAnswerAndNext);

router.post('/abandon', abandonInterview);


export default router;
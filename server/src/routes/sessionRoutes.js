import express from 'express';
import { auth } from '../middlewares/auth';
import { createSession, deleteOneSession, getALLSessions, getOneSession } from '../controllers/sessionControllers';


const router= express.Router();



router.post('/', auth, createSession);
router.get('/sessions/:sessionId', auth, getOneSession);
router.get('/sessions', auth, getALLSessions);
router.delete('/sessions/:sessionId', auth, deleteOneSession);

export default router;
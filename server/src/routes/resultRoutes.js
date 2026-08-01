import express from 'express';
import { auth } from '../middlewares/auth.js';
import { getAllResults, getOneResult } from '../controllers/resultControllers.js';

const router= express.Router();

router.get('/', auth, getAllResults);

router.get('/:sessionId', auth, getOneResult);

export default router;
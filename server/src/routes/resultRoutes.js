import express from 'express';

const router= express.Router();

router.get('/', auth, getAllResults);

router.get('/:sessionId', auth, getOneResult);

export default router;
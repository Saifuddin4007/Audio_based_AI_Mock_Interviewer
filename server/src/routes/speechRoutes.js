import { Router } from 'express';
import { upload } from '../middlewares/upload.js';
import { uploadAudio } from '../controllers/speechController.js';
import { auth } from '../middlewares/auth.js';

const router= Router();

router.post('/audio/upload', auth, upload.single('audio'), uploadAudio);

export default router;
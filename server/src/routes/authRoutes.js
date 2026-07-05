import express from 'express';
import { findMe, userLogin, userLogout, userSignup } from '../controllers/authControllers.js';
import { auth } from '../middlewares/auth';


const router= express.Router();

//!signup
router.post('/signup', userSignup);

//!login
router.post('/login', userLogin);

//!logout
router.post('/logout', userLogout);

//!me
router.get('/me', auth, findMe);

export default router;

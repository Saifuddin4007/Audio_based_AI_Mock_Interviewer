import express from 'express';
import { findMe, refresh, userLogin, userLogout, userSignup } from '../controllers/authControllers.js';
import { auth } from '../middlewares/auth.js';


const router= express.Router();

//!signup
router.post('/signup', userSignup);

//!login
router.post('/login', userLogin);

//!logout
router.post('/logout', userLogout);

//!refresh acess-token
router.post('/refresh', refresh);

//!me
router.get('/me', auth, findMe);

export default router;

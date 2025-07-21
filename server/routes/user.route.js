import express from 'express';


import { getUser, loginUser, logoutUser, addCalendar, getCalendar, deleteCalendar } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/calendar', verifyToken, addCalendar);
router.get('/calendar', verifyToken, getCalendar);
router.delete('/calendar', verifyToken, deleteCalendar);

router.get('/:username', getUser);
router.post('/auth/login', loginUser);
router.post('/:auth/logout', logoutUser);


export default router;
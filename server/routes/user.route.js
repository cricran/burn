import express from 'express';


import { getUser, loginUser, logoutUser, addCalendar, getCalendar, deleteCalendar, testMoodleConnection, listMyCourses, getMyCourseContents } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/calendar', verifyToken, addCalendar);
router.get('/calendar', verifyToken, getCalendar);
router.delete('/calendar', verifyToken, deleteCalendar);

// Test Moodle connectivity using the stored token for the authenticated user
router.get('/moodle/test', verifyToken, testMoodleConnection);
router.get('/moodle/courses', verifyToken, listMyCourses);
router.get('/moodle/courses/:id', verifyToken, getMyCourseContents);

router.get('/:username', getUser);
router.post('/auth/login', loginUser);
router.post('/:auth/logout', logoutUser);


export default router;
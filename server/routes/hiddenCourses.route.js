import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { getHiddenCourses, hideCourse, unhideCourse, listCoursesWithHiddenFlag } from '../controllers/hiddenCourses.controller.js';

const router = express.Router();

router.get('/', verifyToken, getHiddenCourses);
router.post('/hide', verifyToken, hideCourse);
router.post('/unhide', verifyToken, unhideCourse);
// Optional: list courses with hidden flag combined
router.get('/all-with-flags', verifyToken, listCoursesWithHiddenFlag);

export default router;

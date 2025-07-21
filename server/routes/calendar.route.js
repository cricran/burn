import express from 'express';

import { getCalendar } from '../controllers/calendar.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';


const router = express.Router();

// Utilisation de query params pour start et end
router.get('/', verifyToken, getCalendar);

export default router;
import express from 'express';
import { getColorSettings, updateColorSettings } from '../controllers/colorSettings.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';


const router = express.Router();

router.get('/', verifyToken, getColorSettings);
router.put('/', verifyToken, updateColorSettings);

export default router;
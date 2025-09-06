import express from 'express'
import { verifyToken } from '../middlewares/verifyToken.js'
import { getMailSettings, updateMailSettings } from '../controllers/mailSettings.controller.js'

const router = express.Router()

router.get('/', verifyToken, getMailSettings)
router.patch('/', verifyToken, updateMailSettings)

export default router

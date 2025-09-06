import express from 'express'
import { verifyToken } from '../middlewares/verifyToken.js'
import { getPublicKey, testMail, listMail, getMessage, deleteMessage, getSogoLink, markSeen } from '../controllers/mail.controller.js'

const router = express.Router()

router.get('/public-key', verifyToken, getPublicKey)
router.get('/sogo', getSogoLink)
router.post('/test', verifyToken, testMail)
router.post('/list', verifyToken, listMail)
router.post('/message', verifyToken, getMessage)
router.post('/delete', verifyToken, deleteMessage)
router.post('/seen', verifyToken, markSeen)

export default router

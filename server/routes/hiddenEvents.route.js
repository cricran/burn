import express from 'express';
import {
    hideIndividualEvent,
    hideEventsByName,
    showIndividualEvent,
    showEventsByName,
    getHiddenEvents
} from '../controllers/hiddenEvents.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

// Routes pour la gestion des événements masqués
router.post('/hide-individual', verifyToken, hideIndividualEvent);
router.post('/hide-by-name', verifyToken, hideEventsByName);
router.post('/show-individual', verifyToken, showIndividualEvent);
router.post('/show-by-name', verifyToken, showEventsByName);
router.get('/', verifyToken, getHiddenEvents);

export default router;

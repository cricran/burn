import express from 'express';
import { addNote, toggleNote, deleteNote } from '../controllers/note.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

// Routes pour la gestion des notes
router.post('/add', verifyToken, addNote);
router.put('/toggle', verifyToken, toggleNote);
router.delete('/delete', verifyToken, deleteNote);

export default router;
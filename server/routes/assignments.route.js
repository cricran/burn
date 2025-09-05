import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { listAssignments, getAssignStatus, uploadAssignFiles, submitAssignment, saveAssignmentDraft } from '../controllers/assignments.controller.js';

const router = express.Router();

// List assignments for a course
router.get('/course/:courseId', verifyToken, listAssignments);

// Get submission status for an assignment
router.get('/:assignId/status', verifyToken, getAssignStatus);

// Upload files to draft area and get draftitemid
router.post('/:assignId/upload', verifyToken, uploadAssignFiles);

// Save submission (attach draft files and/or onlinetext) and submit for grading
router.post('/:assignId/submit', verifyToken, submitAssignment);

// Save as draft (no final submit)
router.post('/:assignId/save', verifyToken, saveAssignmentDraft);

export default router;

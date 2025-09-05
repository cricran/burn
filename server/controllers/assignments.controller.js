import User from '../models/user.model.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  getAssignmentsByCourse,
  getSubmissionStatus,
  uploadFilesToDraft,
  saveSubmission,
  submitForGrading
} from '../utils/moodleApi.js';

const sanitizeMoodleToken = (t) => (typeof t === 'string' ? t.trim().replace(/^:+/, '').replace(/:+$/, '') : '');

export const listAssignments = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const token = sanitizeMoodleToken(user.moodleToken);
    const { courseId } = req.params;
    const list = await getAssignmentsByCourse(token, Number(courseId));
    return res.status(200).json({ assignments: list });
  } catch (e) {
    const status = e.code === 'invalidtoken' ? 401 : 500;
    return res.status(status).json({ error: 'Failed to fetch assignments', details: e.message });
  }
}

export const getAssignStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const token = sanitizeMoodleToken(user.moodleToken);
    const { assignId } = req.params;
    const status = await getSubmissionStatus(token, Number(assignId));
    return res.status(200).json({ status });
  } catch (e) {
    const status = e.code === 'invalidtoken' ? 401 : 500;
    return res.status(status).json({ error: 'Failed to fetch submission status', details: e.message });
  }
}

export const uploadAssignFiles = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const token = sanitizeMoodleToken(user.moodleToken);

    // Files are expected as raw buffers base64 in JSON to stay simple and avoid multipart on our server
    // Body: { files: [{ filename, mimetype, contentBase64 }] }
    const filesInput = Array.isArray(req.body?.files) ? req.body.files : [];
    if (!filesInput.length) return res.status(400).json({ error: 'No files provided' });
    // Basic safety caps
    if (filesInput.length > 10) return res.status(400).json({ error: 'Too many files' });

    const files = filesInput.map(f => ({
      filename: String(f.filename || 'upload.bin'),
      mimetype: String(f.mimetype || 'application/octet-stream'),
      buffer: Buffer.from(String(f.contentBase64 || ''), 'base64')
    }));
    const total = files.reduce((s, f) => s + (f.buffer?.length || 0), 0);
    if (total > 50 * 1024 * 1024) return res.status(413).json({ error: 'Payload too large (max 50MB per request)' });

    const { itemid } = await uploadFilesToDraft(token, files);
    return res.status(200).json({ draftitemid: itemid });
  } catch (e) {
    const status = e.code === 'invalidtoken' ? 401 : 500;
    return res.status(status).json({ error: 'Failed to upload files', details: e.message });
  }
}

export const submitAssignment = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const token = sanitizeMoodleToken(user.moodleToken);
    const { assignId } = req.params;
    const { draftitemid, onlinetext, acceptStatement } = req.body || {};
    if (!draftitemid && !onlinetext) return res.status(400).json({ error: 'Nothing to submit (files or text required)' });

    await saveSubmission(token, Number(assignId), Number(draftitemid || 0), onlinetext);
    const result = await submitForGrading(token, Number(assignId), acceptStatement !== false);
    return res.status(200).json({ ok: true, result });
  } catch (e) {
    const status = e.code === 'invalidtoken' ? 401 : 500;
    return res.status(status).json({ error: 'Failed to submit assignment', details: e.message });
  }
}

export default { listAssignments, getAssignStatus, uploadAssignFiles, submitAssignment };

// Save only (keep as draft), without submitting for grading
export const saveAssignmentDraft = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const token = sanitizeMoodleToken(user.moodleToken);
    const { assignId } = req.params;
    const { draftitemid, onlinetext } = req.body || {};
    if (!draftitemid && !onlinetext) return res.status(400).json({ error: 'Nothing to save (files or text required)' });
    const result = await saveSubmission(token, Number(assignId), Number(draftitemid || 0), onlinetext);
    return res.status(200).json({ ok: true, result });
  } catch (e) {
    const status = e.code === 'invalidtoken' ? 401 : 500;
    return res.status(status).json({ error: 'Failed to save assignment', details: e.message });
  }
}

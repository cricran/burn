import User from '../models/user.model.js';
import { getSiteInfo, getUserCourses, getCoursesByClassification, setHiddenCoursesPreference } from '../utils/moodleApi.js';

// Helper to sanitize Moodle token (remove stray leading/trailing colons and trim)
const sanitizeMoodleToken = (t) => (typeof t === 'string' ? t.trim().replace(/^:+/, '').replace(/:+$/, '') : '');

// Get list of hidden course ids for current user
export const getHiddenCourses = async (req, res) => {
	try {
		const user = await User.findById(req.userId);
		if (!user) return res.status(404).json({ error: 'User not found' });
		// Seed from Moodle preference if local list empty
		if (!user.hiddenCourses || user.hiddenCourses.length === 0) {
			const token = sanitizeMoodleToken(user.moodleToken);
			const remoteHidden = await getCoursesByClassification(token, 'hidden');
			if (remoteHidden?.length) {
				user.hiddenCourses = Array.from(new Set(remoteHidden.map(c => c.id)));
				await user.save();
			}
		}
		return res.status(200).json({ hiddenCourses: user.hiddenCourses || [] });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to load hidden courses', details: e.message });
	}
}

// Hide a course id for the user
export const hideCourse = async (req, res) => {
	const { courseId } = req.body;
	const cid = Number(courseId);
	if (!cid) return res.status(400).json({ error: 'Invalid courseId' });
	try {
		const user = await User.findById(req.userId);
		if (!user) return res.status(404).json({ error: 'User not found' });
		if (!Array.isArray(user.hiddenCourses)) user.hiddenCourses = [];
		if (!user.hiddenCourses.includes(cid)) user.hiddenCourses.push(cid);
		await user.save();
		// Try to mirror to Moodle preference (best-effort)
		const token = sanitizeMoodleToken(user.moodleToken);
		setHiddenCoursesPreference(token, user.hiddenCourses).catch(() => {});
		return res.status(200).json({ hiddenCourses: user.hiddenCourses });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to hide course', details: e.message });
	}
}

// Unhide a course id for the user
export const unhideCourse = async (req, res) => {
	const { courseId } = req.body;
	const cid = Number(courseId);
	if (!cid) return res.status(400).json({ error: 'Invalid courseId' });
	try {
		const user = await User.findById(req.userId);
		if (!user) return res.status(404).json({ error: 'User not found' });
		if (!Array.isArray(user.hiddenCourses)) user.hiddenCourses = [];
		user.hiddenCourses = user.hiddenCourses.filter(id => id !== cid);
		await user.save();
		// Try to mirror to Moodle preference (best-effort)
		const token = sanitizeMoodleToken(user.moodleToken);
		setHiddenCoursesPreference(token, user.hiddenCourses).catch(() => {});
		return res.status(200).json({ hiddenCourses: user.hiddenCourses });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to unhide course', details: e.message });
	}
}

// List courses with hidden flag (optional passthrough for UI convenience)
export const listCoursesWithHiddenFlag = async (req, res) => {
	try {
		const user = await User.findById(req.userId);
		if (!user) return res.status(404).json({ error: 'User not found' });
		const token = sanitizeMoodleToken(user.moodleToken);
		const site = await getSiteInfo(token);
		const courses = await getUserCourses(token, site.userid);
		const hiddenSet = new Set(user.hiddenCourses || []);
		const mapped = courses.map(c => ({ id: c.id, shortname: c.shortname, fullname: c.fullname, hidden: hiddenSet.has(c.id) }));
		return res.status(200).json({ courses: mapped });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch courses', details: e.message });
	}
}

export default { getHiddenCourses, hideCourse, unhideCourse, listCoursesWithHiddenFlag };

import User from '../models/user.model.js';
import SyncLog from '../models/syncLog.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

import moodleToken from '../utils/connectMoodle.js';
import testMoodleToken from '../utils/testMoodleToken.js';
import { getSiteInfo, getUserCourses, getCourseContents, buildCourseUrl, buildAuthenticatedFileUrl } from '../utils/moodleApi.js';

// Helper to sanitize Moodle token (remove stray leading/trailing colons and trim)
const sanitizeMoodleToken = (t) => {
    if (typeof t !== 'string') return '';
    return t.trim().replace(/^:+/, '').replace(/:+$/, '');
}

export const loginUser = async (req, res) => {
    let { username, password } = req.body;

    username = username?.trim();
    password = password?.trim();

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.', message: 'Le mot de passe et le nom d\'utilisateur sont requis.' });
    }

    const user = await User.findOne({ username });
    if (!user) {
        // test connexion with moodle
        const moodleRes = await moodleToken(username, password);
        if (!moodleRes.success) {
            return res.status(401).json({ error: 'Moodle connection failed.', message: 'L\'identifiant ou mot de passe est incorrect.' });
        }
        // If user does not exist, create a new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            password: hashedPassword,
            moodleToken: moodleRes.token,
        });

        const JStoken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);

        res.cookie('jwt', JStoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'Lax' : 'Lax',
            maxAge: 365 * 24 * 60 * 60 * 1000
        });

        const { password: _pw, ...userData } = newUser.toObject();

        return res.status(201).json(userData);
    } else {
        let token = sanitizeMoodleToken(user.moodleToken);
        console.log("Existing user found. Testing Moodle token:", token);
        if (await testMoodleToken(token)) {
            console.log("Moodle token is valid for user:", username);
            // If sanitized token differs from stored, persist the clean value
            if (token !== user.moodleToken) {
                try { user.moodleToken = token; await user.save(); } catch (_) { /* ignore */ }
            }
            // If user exists, check password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid) {
                // Password is valid, return user data without password
                const { password: _pw, ...userData } = user.toObject();

                const JStoken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

                res.cookie('jwt', JStoken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'Lax' : 'Lax',
                });

                return res.status(200).json(userData);
            } else {
                // Password is invalid
                return res.status(401).json({ error: 'Invalid password.', message: 'Le mot de passe ou l\'identifiant est incorrect.' });
            }
        } else {
            // If Moodle token is invalid, try to re-authenticate with Moodle
            const newToken = await moodleToken(username, password);
            if (!newToken.success) {
                return res.status(401).json({ error: 'Moodle connection failed.', message: 'L\'identifiant ou le mot de passe est incorrect.' });
            }
            // Update user with new token and password
            user.moodleToken = sanitizeMoodleToken(newToken.token);
            user.password = await bcrypt.hash(password, 10); // Update password hash
            await user.save();

            // Issue JWT cookie
            const JStoken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            res.cookie('jwt', JStoken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'Lax' : 'Lax',
            });

            const { password: _pw, ...userData } = user.toObject();
            return res.status(200).json(userData);
        }

    }
}

export const logoutUser = async (req, res) => {
    res.clearCookie('jwt');

    return res.status(200).json({ message: 'Logged out successfully' });
}

export const getUser = async (req, res) => {
    const { username } = req.params;

    const user = await User.findOne({ username });

    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    const { password: _pw, ...userData } = user.toObject();

    return res.status(200).json(userData);
}

// Return authenticated user from JWT cookie
export const getMe = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        const { password: _pw, ...userData } = user.toObject();
        return res.status(200).json(userData);
    } catch (e) {
        return res.status(500).json({ error: 'Failed to load user', details: e?.message });
    }
}

// Test Moodle connectivity for the authenticated user by validating the stored token
export const testMoodleConnection = async (req, res) => {
    console.log("Testing Moodle connection for user:", req.userId);

    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });

        let token = sanitizeMoodleToken(user.moodleToken);
        console.log("Using Moodle token:", token);

        const ok = await testMoodleToken(token);
        if (ok) {
            console.log("Moodle connection successful for user:", user.username);
            // If sanitized token differs from stored, persist the clean value
            if (token !== user.moodleToken) {
                try { user.moodleToken = token; await user.save(); } catch (_) { /* ignore */ }
            }
            return res.status(200).json({ ok: true, message: 'Moodle token is valid and reachable.' });
        } else {
            console.log("Moodle connection failed for user:", user.username);
            return res.status(200).json({ ok: false, message: 'Failed to reach Moodle or token invalid.' });
        }
    } catch (error) {
        return res.status(500).json({ ok: false, error: 'Internal error while testing Moodle connectivity.', details: error?.message });
    }
}

export const addCalendar = async (req, res) => {
    const { calendarUrl } = req.body;
    const userId = req.userId;

    if (!calendarUrl) {
        return res.status(400).json({ error: "Calendar URL is required." });
    }

    if (!calendarUrl.includes('ical') && !calendarUrl.includes('ics')) {
        return res.status(400).json({ error: "Calendar URL must be in the format 'ical' or 'ics'.", message: "L'URL du calendrier doit être au format 'ical' ou 'ics'." });
    }


    try {
        const response = await fetch(calendarUrl);
        if (!response.ok) {
            return res.status(400).json({ error: "Calendar URL is not valid or not reachable.", message: "L'URL du calendrier n'est pas valide ou n'est pas accessible." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Prevent duplicates
        if (user.icalURL.includes(calendarUrl)) {
            return res.status(400).json({ error: "Calendar URL already added.", message: "L'URL du calendrier a déjà été ajoutée." });
        }

        user.icalURL.push(calendarUrl);
        await user.save();

        // Delete the sync log for this user to be able to resync the calendar
        await SyncLog.deleteOne({ userId: userId });

        return res.status(200).json({ message: "Emploi du Temps ajouté avec succès." });
    } catch (error) {
        return res.status(500).json({ error: "Error while adding calendar.", details: error.message });
    }
}

export const getCalendar = async (req, res) => {
    console.log("Fetching calendar for user:", req.userId);

    const userId = req.userId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        return res.status(200).json({ icalURL: user.icalURL });
    } catch (error) {
        return res.status(500).json({ error: "Error while fetching calendar.", details: error.message });
    }
}

export const deleteCalendar = async (req, res) => {
    const { calendarUrl } = req.body;
    const userId = req.userId;

    if (!calendarUrl) {
        return res.status(400).json({ error: "Calendar URL is required." });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Check if the calendar URL exists
        if (!user.icalURL.includes(calendarUrl)) {
            return res.status(404).json({ error: "Calendar URL not found." });
        }

        // Remove the calendar URL
        user.icalURL = user.icalURL.filter(url => url !== calendarUrl);
        await user.save();

        // Delete the sync log for this user to be able to resync the calendar
        await SyncLog.deleteOne({ userId: userId });

        return res.status(200).json({ message: "Calendar deleted successfully." });
    } catch (error) {
        return res.status(500).json({ error: "Error while deleting calendar.", details: error.message });
    }
}

// --- UniversiTice: list courses for current user ---
export const listMyCourses = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        const token = sanitizeMoodleToken(user.moodleToken);
        const site = await getSiteInfo(token);
        const courses = await getUserCourses(token, site.userid);
        const hiddenSet = new Set(user.hiddenCourses || []);
        const showHidden = String(req.query.showHidden || 'false') === 'true';
        // Shape minimal data for UI
        let simplified = courses.map(c => {
            let image = null;
            // Prefer Moodle-provided courseimage if available
            if (c.courseimage) {
                image = buildAuthenticatedFileUrl(c.courseimage, token) || c.courseimage;
            }
            if (!image) {
                const files = Array.isArray(c.overviewfiles) ? c.overviewfiles : [];
                const img = files.find(f => (f?.fileurl && ((f?.mimetype || '').startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(f?.filename || ''))));
                if (img?.fileurl) {
                    image = buildAuthenticatedFileUrl(img.fileurl, token) || img.fileurl;
                }
            }
            return {
                id: c.id,
                shortname: c.shortname,
                fullname: c.fullname,
                courseurl: buildCourseUrl(c.id),
                hidden: hiddenSet.has(c.id),
                image
            };
        });
        if (!showHidden) {
            simplified = simplified.filter(c => !c.hidden);
        }
        return res.status(200).json({ courses: simplified });
    } catch (e) {
        if (e.code === 'invalidtoken') return res.status(401).json({ error: 'invalidtoken' });
        return res.status(500).json({ error: 'Failed to fetch courses', details: e.message });
    }
}

// --- UniversiTice: course contents ---
export const getMyCourseContents = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const courseId = Number(id);
        if (!courseId) return res.status(400).json({ error: 'Invalid course id' });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        const token = sanitizeMoodleToken(user.moodleToken);
        const contents = await getCourseContents(token, courseId);
        // Post-process: attach direct file URLs with token where applicable
        const processed = contents.map(section => ({
            id: section.id,
            name: section.name,
            summary: section.summary,
            modules: (section.modules || []).map(m => ({
                id: m.id,
                instance: m.instance,
                name: m.name,
                modname: m.modname,
                // Include full HTML description when available (e.g., labels)
                description: m.description,
                url: m.url,
                contents: (m.contents || []).map(f => ({
                    filename: f.filename,
                    fileurl: buildAuthenticatedFileUrl(f.fileurl, token) || f.fileurl,
                    filesize: f.filesize,
                    mimetype: f.mimetype
                }))
            }))
        }));
        return res.status(200).json({ contents: processed });
    } catch (e) {
        if (e.code === 'invalidtoken') return res.status(401).json({ error: 'invalidtoken' });
        return res.status(500).json({ error: 'Failed to fetch course contents', details: e.message });
    }
}
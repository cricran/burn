import User from '../models/user.model.js';
import SyncLog from '../models/syncLog.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

import moodleToken from '../utils/connectMoodle.js';
import testMoodleToken from '../utils/testMoodleToken.js';

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
            sameSite: 'Strict',
            maxAge: 2147483647
        });

        const { password: _pw, ...userData } = newUser.toObject();

        return res.status(201).json(userData);
    } else {
        const token = user.moodleToken;
        if (testMoodleToken(token)) {
            // If user exists, check password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid) {
                // Password is valid, return user data without password
                const { password: _pw, ...userData } = user.toObject();

                const JStoken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

                res.cookie('jwt', JStoken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Strict',
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
            user.moodleToken = newToken;
            user.password = await bcrypt.hash(password, 10); // Update password hash
            await user.save();

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
        SyncLog.deleteOne({ userId: userId });

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
        SyncLog.deleteOne({ userId: userId });

        return res.status(200).json({ message: "Calendar deleted successfully." });
    } catch (error) {
        return res.status(500).json({ error: "Error while deleting calendar.", details: error.message });
    }
}
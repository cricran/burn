import User from '../models/user.model.js';
import Calendar from '../models/calendar.model.js';
import updateCalendar from '../utils/updateCalendar.js';

export const getCalendar = async (req, res) => {
    const userId = req.userId;
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: 'Missing start or end date.' });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.icalURL || user.icalURL.length === 0) {
        return res.status(200).json({ events: [] });
    }

    await updateCalendar(userId, user.icalURL, new Date());

    // Filtrer les événements dans l'intervalle demandé
    const calendar = await Calendar.find({
        userId: userId,
        start: { $gte: new Date(start) },
        end: { $lte: new Date(end) }
    });

    if (!calendar || calendar.length === 0) {
        return res.status(200).json({ events: [] });
    }

    // Mapping pour le frontend
    const mappedEvents = calendar.map(ev => ({
        ...ev.toObject(),
        start: ev.start,
        end: ev.end,
        notes: ev.notes || []
    }));

    return res.status(200).json({ events: mappedEvents });
}
import User from '../models/user.model.js';
import Calendar from '../models/calendar.model.js';
import updateCalendar from '../utils/updateCalendar.js';

// Fonction utilitaire pour nettoyer le titre du cours
const cleanCourseTitle = (title) => {
    if (!title) return '';
    
    // Supprimer les préfixes CM, TD, TP, CC (insensible à la casse, avec variations possibles)
    return title
        .replace(/^(cm|td|tp|cc)\s*[-:]?\s*/gi, '')
        .replace(/\s*(cm|td|tp|cc)\s*$/gi, '')
        .trim();
};

export const getCalendar = async (req, res) => {
    const userId = req.userId;
    const { start, end, includeHidden = false } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: 'Missing start or end date.' });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    // Only attempt sync if user has sources; updateCalendar already rate-limits by 30min
    let syncStatus = null;
    if (Array.isArray(user.icalURL) && user.icalURL.length > 0) {
        syncStatus = await updateCalendar(userId, user.icalURL, new Date());
    }

    // Filtrer les événements dans l'intervalle demandé
    let calendar = await Calendar.find({
        userId: userId,
        start: { $gte: new Date(start) },
        end: { $lte: new Date(end) }
    });

    if (!calendar || calendar.length === 0) {
        return res.status(200).json({ events: [] });
    }

    // Si includeHidden est false, filtrer les événements masqués
    if (includeHidden === false || includeHidden === 'false') {
        calendar = calendar.filter(event => {
            // Vérifier si l'événement est masqué individuellement
            if (user.hiddenEvents?.individual?.includes(event._id.toString())) {
                return false;
            }

            // Vérifier si l'événement est masqué par nom
            if (user.hiddenEvents?.byName?.some(hiddenName =>
                cleanCourseTitle(event.title).toLowerCase() === hiddenName.toLowerCase()
            )) {
                return false;
            }

            // Vérifier le champ 'show' de l'événement
            if (event.show === false) {
                return false;
            }

            return true;
        });
    }

    // Mapping pour le frontend
    const mappedEvents = calendar.map(ev => ({
        ...ev.toObject(),
        start: ev.start,
        end: ev.end,
        notes: ev.notes || []
    }));

    const response = { events: mappedEvents };
    if (syncStatus?.error) {
        response.syncWarning = 'fetch-empty';
    }

    return res.status(200).json(response);
}
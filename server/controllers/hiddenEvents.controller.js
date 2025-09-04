import User from '../models/user.model.js';
import Calendar from '../models/calendar.model.js';

// Masquer un événement individuel
export const hideIndividualEvent = async (req, res) => {
    const { eventId } = req.body;
    const userId = req.userId;

    if (!eventId) {
        return res.status(400).json({
            error: 'Event ID is required.',
            message: "L'identifiant de l'événement est requis."
        });
    }

    try {
        // Vérifier si l'événement appartient à l'utilisateur
        const event = await Calendar.findOne({ _id: eventId, userId });
        if (!event) {
            return res.status(404).json({
                error: 'Event not found or not owned by the user.',
                message: "L'événement n'a pas été trouvé ou n'appartient pas à l'utilisateur."
            });
        }

        // Ajouter l'événement à la liste des événements masqués individuellement
        const user = await User.findById(userId);
        if (!user.hiddenEvents) user.hiddenEvents = { individual: [], byName: [] };
        if (!user.hiddenEvents.individual.includes(eventId)) {
            user.hiddenEvents.individual.push(eventId);
            await user.save();
        }

        return res.status(200).json({
            message: "Événement masqué avec succès.",
            hiddenEvents: user.hiddenEvents
        });

    } catch (error) {
        console.error("Error hiding individual event:", error);
        return res.status(500).json({
            error: "Erreur lors du masquage de l'événement.",
            details: error.message
        });
    }
};

// Masquer tous les événements d'un nom
export const hideEventsByName = async (req, res) => {
    const { eventName } = req.body;
    const userId = req.userId;

    if (!eventName) {
        return res.status(400).json({
            error: 'Event name is required.',
            message: "Le nom de l'événement est requis."
        });
    }

    try {
        const user = await User.findById(userId);
        if (!user.hiddenEvents) user.hiddenEvents = { individual: [], byName: [] };
        if (!user.hiddenEvents.byName.includes(eventName)) {
            user.hiddenEvents.byName.push(eventName);
            await user.save();
        }

        return res.status(200).json({
            message: "Événements masqués avec succès.",
            hiddenEvents: user.hiddenEvents
        });

    } catch (error) {
        console.error("Error hiding events by name:", error);
        return res.status(500).json({
            error: "Erreur lors du masquage des événements.",
            details: error.message
        });
    }
};

// Afficher un événement individuel
export const showIndividualEvent = async (req, res) => {
    const { eventId } = req.body;
    const userId = req.userId;

    if (!eventId) {
        return res.status(400).json({
            error: 'Event ID is required.',
            message: "L'identifiant de l'événement est requis."
        });
    }

    try {
        const user = await User.findById(userId);
        if (!user.hiddenEvents) user.hiddenEvents = { individual: [], byName: [] };
        user.hiddenEvents.individual = user.hiddenEvents.individual.filter(
            id => id.toString() !== eventId
        );
        await user.save();

        return res.status(200).json({
            message: "Événement affiché avec succès.",
            hiddenEvents: user.hiddenEvents
        });

    } catch (error) {
        console.error("Error showing individual event:", error);
        return res.status(500).json({
            error: "Erreur lors de l'affichage de l'événement.",
            details: error.message
        });
    }
};

// Afficher tous les événements d'un nom
export const showEventsByName = async (req, res) => {
    const { eventName } = req.body;
    const userId = req.userId;

    if (!eventName) {
        return res.status(400).json({
            error: 'Event name is required.',
            message: "Le nom de l'événement est requis."
        });
    }

    try {
        const user = await User.findById(userId);
        if (!user.hiddenEvents) user.hiddenEvents = { individual: [], byName: [] };
        user.hiddenEvents.byName = user.hiddenEvents.byName.filter(
            name => name !== eventName
        );
        await user.save();

        return res.status(200).json({
            message: "Événements affichés avec succès.",
            hiddenEvents: user.hiddenEvents
        });

    } catch (error) {
        console.error("Error showing events by name:", error);
        return res.status(500).json({
            error: "Erreur lors de l'affichage des événements.",
            details: error.message
        });
    }
};

// Récupérer les paramètres de masquage
export const getHiddenEvents = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('hiddenEvents');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({
            individual: user.hiddenEvents?.individual || [],
            byName: user.hiddenEvents?.byName || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des paramètres', error: error.message });
    }
};

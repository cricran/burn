import Calendar from '../models/calendar.model.js';

// Ajouter une note à un événement
export const addNote = async (req, res) => {
    const { eventId, text } = req.body;
    const userId = req.userId;

    if (!eventId || !text) {
        return res.status(400).json({ 
            error: 'Event ID and text are required.',
            message: "L'identifiant de l'événement et le texte sont requis." 
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

        // Ajouter la note à l'événement
        if (!event.tasks) event.tasks = [];
        
        event.tasks.push({
            text: text,
            done: false
        });

        await event.save();

        return res.status(200).json({ 
            message: "Note ajoutée avec succès.",
            tasks: event.tasks 
        });

    } catch (error) {
        console.error("Error adding note:", error);
        return res.status(500).json({ 
            error: "Erreur lors de l'ajout de la note.",
            details: error.message 
        });
    }
};

// Marquer une note comme faite/non faite
export const toggleNote = async (req, res) => {
    const { eventId, noteIndex, done } = req.body;
    const userId = req.userId;

    if (!eventId || noteIndex === undefined || done === undefined) {
        return res.status(400).json({ 
            error: 'Event ID, note index and done status are required.',
            message: "L'identifiant de l'événement, l'index de la note et le statut sont requis."
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

        // Vérifier si la note existe
        if (!event.tasks || !event.tasks[noteIndex]) {
            return res.status(404).json({ 
                error: 'Note not found.',
                message: "La note n'a pas été trouvée."
            });
        }

        // Mettre à jour le statut de la note
        event.tasks[noteIndex].done = done;
        await event.save();

        return res.status(200).json({ 
            message: done ? "Note marquée comme faite." : "Note marquée comme non faite.",
            tasks: event.tasks 
        });

    } catch (error) {
        console.error("Error toggling note:", error);
        return res.status(500).json({ 
            error: "Erreur lors de la mise à jour de la note.",
            details: error.message 
        });
    }
};

// Supprimer une note
export const deleteNote = async (req, res) => {
    const { eventId, noteIndex } = req.body;
    const userId = req.userId;

    if (!eventId || noteIndex === undefined) {
        return res.status(400).json({ 
            error: 'Event ID and note index are required.',
            message: "L'identifiant de l'événement et l'index de la note sont requis."
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

        // Vérifier si la note existe
        if (!event.tasks || !event.tasks[noteIndex]) {
            return res.status(404).json({ 
                error: 'Note not found.',
                message: "La note n'a pas été trouvée."
            });
        }

        // Supprimer la note
        event.tasks.splice(noteIndex, 1);
        await event.save();

        return res.status(200).json({ 
            message: "Note supprimée avec succès.",
            tasks: event.tasks 
        });

    } catch (error) {
        console.error("Error deleting note:", error);
        return res.status(500).json({ 
            error: "Erreur lors de la suppression de la note.",
            details: error.message 
        });
    }
};
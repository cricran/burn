import { useState, useEffect, useMemo } from 'react';
import { FileText } from 'lucide-react';
import './dailyNotesList.css';
import useCalendarStore from '../../utils/calendarStore';
import GroupNotes from '../groupNotes/groupNotes';

function DailyNotesList({ onEventClick }) {
    const { currentEvents, isLoading } = useCalendarStore();
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // Marquer le chargement initial comme terminé
    useEffect(() => {
        if (currentEvents.length > 0 && !initialLoadDone) {
            setInitialLoadDone(true);
        }
    }, [currentEvents, initialLoadDone]);

    // Utiliser useMemo pour calculer les données de notes uniquement quand currentEvents change
    const todayNotesData = useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Regrouper par jour (seulement aujourd'hui)
        const groupedByDay = {};

        currentEvents.forEach(event => {
            if (event.tasks && event.tasks.length > 0) {
                const eventDate = new Date(event.start).toISOString().split('T')[0];

                // Ne traiter que les événements d'aujourd'hui
                if (eventDate === todayStr) {
                    const day = event.start.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    });

                    if (!groupedByDay[day]) {
                        groupedByDay[day] = [];
                    }

                    groupedByDay[day].push({
                        name: event.title,
                        eventId: event._id,
                        // Utiliser un identifiant stable pour chaque note
                        tasks: event.tasks.map((task, index) => ({
                            ...task,
                            id: `${event._id}-${index}`
                        }))
                    });
                }
            }
        });

        // Convertir en format pour les composants
        return Object.keys(groupedByDay).map(day => ({
            title: day,
            notes: groupedByDay[day]
        }));
    }, [currentEvents]);

    // Fonction pour ouvrir EventDetails
    const handleOpenEventDetails = (eventId) => {
        const event = currentEvents.find(e => e._id === eventId);
        if (event && onEventClick) {
            onEventClick(event);
        }
    };

    // Montrer l'indicateur de chargement uniquement lors du chargement initial
    const showLoading = isLoading && !initialLoadDone;
    // Montrer le message "aucune note" uniquement si le chargement initial est terminé et qu'il n'y a pas de notes
    const showEmpty = initialLoadDone && todayNotesData.length === 0;

    return (
        <div className="daily-notes-list">
            <div className="module-header">
                <h3>Notes du jour</h3>
                <span className="notes-count">
                    {todayNotesData.reduce((total, day) => total + day.notes.length, 0)} notes
                </span>
            </div>

            <div className="notes-container">
                {showLoading ? (
                    <div className="loading">Chargement des notes...</div>
                ) : showEmpty ? (
                    <div className="no-notes">
                        <FileText size={48} />
                        <p>Aucune note pour aujourd'hui</p>
                    </div>
                ) : (
                    todayNotesData.map((data, index) => (
                        // Utiliser un identifiant stable pour chaque jour
                        <GroupNotes
                            key={`day-${data.title}`}
                            data={data}
                            onOpenEventDetails={handleOpenEventDetails}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default DailyNotesList;
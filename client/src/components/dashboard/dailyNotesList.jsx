import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText } from 'lucide-react';
import './dailyNotesList.css';
import useCalendarStore from '../../utils/calendarStore';
import GroupNotes from '../groupNotes/groupNotes';
import { computeTodayWindow, isSameLocalDay as sameLocalDay, eventOverlapsWindow } from '../../utils/timeWindow';

function DailyNotesList({ onEventClick }) {
    const { currentEvents, isLoading, events: weeksCache, getWeekKeyFor } = useCalendarStore();
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [displayedDate, setDisplayedDate] = useState(new Date());
    const [relativeLabel, setRelativeLabel] = useState("aujourd'hui");
    const [eventsForDay, setEventsForDay] = useState([]);

    // Marquer le chargement initial comme terminé
    useEffect(() => {
        if (currentEvents.length > 0 && !initialLoadDone) {
            setInitialLoadDone(true);
        }
    }, [currentEvents, initialLoadDone]);

    // Helper hoisted so it's available in hooks below
    function isSameLocalDay(a, b) { return sameLocalDay(a, b); }

    // Utiliser useMemo pour calculer les données de notes uniquement quand currentEvents change
        const todayNotesData = useMemo(() => {
        // Regrouper par jour (seulement la date affichée)
        const groupedByDay = {};

        // If displayed date is today, filter events within the computed window
        let sourceEvents = eventsForDay || [];
        if (isSameLocalDay(displayedDate, new Date()) && sourceEvents.length > 0) {
            const window = computeTodayWindow(sourceEvents);
            if (window) {
                sourceEvents = sourceEvents.filter(ev => eventOverlapsWindow(ev, window.startWindow, window.endWindow));
            }
        }

        sourceEvents.forEach(event => {
            if (event.tasks && event.tasks.length > 0) {
                if (isSameLocalDay(event.start, displayedDate)) {
                    const day = new Date(event.start).toLocaleDateString('fr-FR', {
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
    }, [eventsForDay, displayedDate]);

    // Fonction pour ouvrir EventDetails
    const handleOpenEventDetails = (eventId) => {
        let event = (currentEvents || []).find(e => e._id === eventId);
        if (!event) {
            event = (eventsForDay || []).find(e => e._id === eventId);
        }
        if (event && onEventClick) {
            onEventClick(event);
        }
    };

    const formatRelative = useCallback((targetDate) => {
        const start = new Date();
        start.setHours(0,0,0,0);
        const d = new Date(targetDate);
        d.setHours(0,0,0,0);
        const diffDaysRaw = (d - start) / (1000 * 60 * 60 * 24);
        const diffDays = Math.max(0, Math.floor(diffDaysRaw));
        if (diffDays === 0) return "aujourd'hui";
        if (diffDays === 1) return 'demain';
        if (diffDays === 7) return 'dans une semaine';
        if (diffDays < 7) return `dans ${diffDays} jours`;
        if (diffDays < 30) {
            const weeks = Math.round(diffDays / 7);
            return weeks === 1 ? 'dans une semaine' : `dans ${weeks} semaines`;
        }
        const months = Math.round(diffDays / 30);
        return months === 1 ? 'dans un mois' : `dans ${months} mois`;
    }, []);

    // (moved helper above)

    // Si aucune note aujourd'hui, chercher le prochain jour avec des notes
    useEffect(() => {
        let cancelled = false;
        const today = new Date();
        today.setHours(0,0,0,0);

        const getNotesForDate = async (date) => {
            const dayStr = date.toISOString().split('T')[0];
            const weekKey = getWeekKeyFor ? getWeekKeyFor(date) : null;
            let weekEvents = weekKey && weeksCache[weekKey] ? weeksCache[weekKey] : null;
            const filtered = (weekEvents || []).filter(ev => {
                return isSameLocalDay(ev.start, date) && ev.tasks && ev.tasks.length > 0;
            });
            return filtered;
        };

        const ensureDayWithNotes = async () => {
            const todayNotes = await getNotesForDate(today);
            if (todayNotes.length > 0) {
                if (!cancelled) {
                    setDisplayedDate(today);
                    setEventsForDay(todayNotes);
                    setRelativeLabel("aujourd'hui");
                }
                return;
            }

            for (let i = 1; i <= 60; i++) {
                const candidate = new Date(today);
                candidate.setDate(candidate.getDate() + i);
                // eslint-disable-next-line no-await-in-loop
                const list = await getNotesForDate(candidate);
                if (list.length > 0) {
                    if (!cancelled) {
                        setDisplayedDate(candidate);
                        setEventsForDay(list);
                        setRelativeLabel(formatRelative(candidate));
                    }
                    return;
                }
            }
            if (!cancelled) {
                setDisplayedDate(today);
                setEventsForDay([]);
                setRelativeLabel("aujourd'hui");
            }
        };

        ensureDayWithNotes();
        return () => { cancelled = true; };
    }, [currentEvents, weeksCache, getWeekKeyFor, formatRelative]);

    // Montrer l'indicateur de chargement uniquement lors du chargement initial
    const showLoading = isLoading && !initialLoadDone;
    // Montrer le message "aucune note" uniquement si le chargement initial est terminé et qu'il n'y a pas de notes
    const showEmpty = initialLoadDone && todayNotesData.length === 0;

    return (
        <div className="daily-notes-list">
            <div className="module-header">
                <h3>Notes du jour</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="notes-count">
                        {todayNotesData.reduce((total, day) => total + day.notes.length, 0)} notes
                    </span>
                    <span className="notes-count" title={displayedDate.toLocaleDateString('fr-FR')}>
                        {relativeLabel}
                    </span>
                </div>
            </div>

            <div className="notes-container">
                {showLoading ? (
                    <div className="loading">Chargement des notes...</div>
                ) : showEmpty ? (
                    <div className="no-notes">
                        <FileText size={48} />
                        <p>Aucune note à venir</p>
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
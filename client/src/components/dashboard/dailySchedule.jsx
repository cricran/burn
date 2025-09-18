import { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, MapPin } from 'lucide-react';
import './dailySchedule.css';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import fr from 'date-fns/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import useCalendarStore from '../../utils/calendarStore';
import useColorSettingsStore from '../../utils/colorSettingsStore';
import { getEventColor, cleanCourseTitle, isEventCancelled, getOptimalTextColor } from '../../utils/colorUtils';

// Localisation en français
const locales = {
  fr: fr,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

function DailySchedule({ onEventClick }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [relativeLabel, setRelativeLabel] = useState("aujourd'hui");
    const [eventsForDay, setEventsForDay] = useState([]);

    const { currentEvents, events: weeksCache, getWeekKeyFor } = useCalendarStore();
    const { colorSettings } = useColorSettingsStore();

    // Événements du jour affiché uniquement
    const dayEvents = useMemo(() => {
        return (eventsForDay || []).slice().sort((a,b) => new Date(a.start) - new Date(b.start));
    }, [eventsForDay]);

    useEffect(() => {
        setIsLoading(false);
    }, [currentEvents]);

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

    const isSameLocalDay = (a, b) => {
        const da = new Date(a);
        const db = new Date(b);
        return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
    };

    // Si aucun événement aujourd'hui, chercher le prochain jour avec des cours (jusqu'à 60 jours)
    useEffect(() => {
        let cancelled = false;
        const today = new Date();
        today.setHours(0,0,0,0);

        const getEventsForDate = async (date) => {
            // pick from cache/API, filter by local day
            const weekKey = getWeekKeyFor ? getWeekKeyFor(date) : null;
            let weekEvents = weekKey && weeksCache[weekKey] ? weeksCache[weekKey] : null;
            // Dashboard: never include cancelled courses
            return (weekEvents || [])
                .filter(ev => isSameLocalDay(ev.start, date))
                .filter(ev => !isEventCancelled(ev));
        };

        const ensureDayWithEvents = async () => {
            // Quick check for today using currentEvents
            const now = new Date();
            const todayList = (currentEvents || []).filter(e => {
                const sameDay = isSameLocalDay(e.start, today);
                // only remaining, and exclude cancelled for dashboard
                return sameDay && new Date(e.end) >= now && !isEventCancelled(e);
            });
            if (todayList.length > 0) {
                if (!cancelled) {
                    setCurrentDate(today);
                    // Exclude cancelled for dashboard
                    setEventsForDay((currentEvents || [])
                        .filter(e => isSameLocalDay(e.start, today))
                        .filter(e => !isEventCancelled(e))
                    );
                    setRelativeLabel("aujourd'hui");
                }
                return;
            }

            for (let i = 1; i <= 60; i++) {
                const candidate = new Date(today);
                candidate.setDate(candidate.getDate() + i);
                // eslint-disable-next-line no-await-in-loop
                const list = await getEventsForDate(candidate);
                if (list.length > 0) {
                    if (!cancelled) {
                        setCurrentDate(candidate);
                        setEventsForDay(list);
                        setRelativeLabel(formatRelative(candidate));
                    }
                    return;
                }
            }
            // No events found in horizon; keep today label
            if (!cancelled) {
                setCurrentDate(today);
                setEventsForDay([]);
                setRelativeLabel("aujourd'hui");
            }
        };

        ensureDayWithEvents();
        return () => { cancelled = true; };
    }, [currentEvents, weeksCache, getWeekKeyFor, formatRelative]);

    // Fonction pour styliser les événements avec les couleurs et contraste optimal
    const eventStyleGetter = useCallback((event) => {
        const eventColor = getEventColor(event, colorSettings);
        const isCancelled = isEventCancelled(event);
        const textColor = getOptimalTextColor(eventColor);

        const style = {
            backgroundColor: eventColor,
            borderRadius: '8px',
            color: textColor,
            padding: '4px 8px',
            border: `1px solid ${eventColor}`,
            fontSize: '0.8rem',
            width: '100%',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            // Ajouter des hachures pour les événements annulés
            ...(isCancelled && {
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, ${textColor === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 3px, ${textColor === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 6px)`,
                opacity: 0.8,
                textDecoration: 'line-through'
            })
        }
        return { style }
    }, [colorSettings]);

    // Gérer le clic sur un événement
    const handleSelectEvent = useCallback((event) => {
        if (onEventClick) {
            onEventClick(event);
        }
    }, [onEventClick]);

    if (isLoading) {
        return (
            <div className="daily-schedule">
                <div className="module-header">
                    <h3>Emploi du temps</h3>
                </div>
                <div className="loading">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="daily-schedule">
            <div className="module-header">
                <h3>Emploi du temps</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="event-count">{dayEvents.length} cours</span>
                    <span className="event-count" title={currentDate.toLocaleDateString('fr-FR')}>
                        {relativeLabel}
                    </span>
                </div>
            </div>

            <div className="calendar-container">
        {dayEvents.length === 0 ? (
                    <div className="no-events">
                        <Clock size={48} />
            <p>Aucun cours prévu à venir</p>
                    </div>
                ) : (
                    <Calendar
                        localizer={localizer}
            events={dayEvents}
                        defaultView='day'
                        views={['day']}
                        view='day'
                        date={currentDate}
                        startAccessor='start'
                        endAccessor='end'
                        min={new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 8, 0)}
                        max={new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 19, 0)}
                        culture='fr'
                        style={{ height: '400px', width: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        toolbar={false}
                        header={false}
                        formats={{
                            timeGutterFormat: 'HH:mm',
                            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                                `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
                        }}
                        components={{
                            event: ({ event }) => {
                                const eventColor = getEventColor(event, colorSettings);
                                const isCancelled = isEventCancelled(event);
                                const textColor = getOptimalTextColor(eventColor);

                                return (
                                    <div className="custom-event-content">
                                        <div className="event-time">
                                            {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                                        </div>
                                        <div className="event-title">
                                            {event.title}
                                        </div>
                                        {event.location && (
                                            <div className="event-location">
                                                <MapPin size={10} />
                                                <span>{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default DailySchedule;

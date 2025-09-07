import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Calendar } from 'lucide-react';
import './dailyCoursesList.css';
import useCalendarStore from '../../utils/calendarStore';
import useColorSettingsStore from '../../utils/colorSettingsStore';
import { getEventColor, cleanCourseTitle, isEventCancelled } from '../../utils/colorUtils';

function DailyCoursesList({ onEventClick }) {
    const [dayEvents, setDayEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [displayedDate, setDisplayedDate] = useState(new Date());
    const [relativeLabel, setRelativeLabel] = useState('aujourd\'hui');

    const { currentEvents, events: weeksCache, fetchEventsForDate, getWeekKeyFor } = useCalendarStore();
    const { colorSettings } = useColorSettingsStore();

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

    useEffect(() => {
        let cancelled = false;

        const getEventsForDate = async (date) => {
            // Find events locally matching the provided date
            // Prefer currentEvents if same week
            const weekKey = getWeekKeyFor ? getWeekKeyFor(date) : null;
            let weekEvents = weekKey && weeksCache[weekKey] ? weeksCache[weekKey] : null;
            if (!weekEvents) {
                weekEvents = await fetchEventsForDate(date);
            }
            const events = (weekEvents || [])
                .filter(ev => isSameLocalDay(ev.start, date))
                .sort((a, b) => new Date(a.start) - new Date(b.start));
            return events;
        };

        const loadBestDay = async () => {
            setIsLoading(true);
            const today = new Date();
            today.setHours(0,0,0,0);

            // First, try today using currentEvents fast path
            const now = new Date();
            const remainingToday = (currentEvents || [])
                .filter(e => isSameLocalDay(e.start, today) && new Date(e.end) >= now);
            let events = (currentEvents || [])
                .filter(e => isSameLocalDay(e.start, today))
                .sort((a, b) => new Date(a.start) - new Date(b.start));

            // If none, look ahead up to 60 days
            let chosenDate = new Date(today);
            if (remainingToday.length === 0) {
                for (let i = 1; i <= 60; i++) {
                    const candidate = new Date(today);
                    candidate.setDate(candidate.getDate() + i);
                    // eslint-disable-next-line no-await-in-loop
                    const dayEvents = await getEventsForDate(candidate);
                    if (dayEvents.length > 0) {
                        events = dayEvents;
                        chosenDate = candidate;
                        break;
                    }
                }
            }

            if (!cancelled) {
                setDayEvents(events);
                setDisplayedDate(chosenDate);
                setRelativeLabel(formatRelative(chosenDate));
                setIsLoading(false);
            }
        };

        loadBestDay();
        return () => { cancelled = true; };
    }, [currentEvents, weeksCache, fetchEventsForDate, getWeekKeyFor, formatRelative]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (start, end) => {
        const startTime = new Date(start);
        const endTime = new Date(end);
        const duration = (endTime - startTime) / (1000 * 60); // en minutes
        return `${Math.round(duration)}min`;
    };

    if (isLoading) {
        return (
            <div className="daily-courses-list">
                <div className="module-header">
                    <h3>Cours du jour</h3>
                </div>
                <div className="loading">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="daily-courses-list">
            <div className="module-header">
                <h3>Cours du jour</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="event-count">{dayEvents.length} cours</span>
                    <span className="event-count" title={displayedDate.toLocaleDateString('fr-FR')}>
                        {relativeLabel}
                    </span>
                </div>
            </div>

            <div className="courses-container">
                {dayEvents.length === 0 ? (
                    <div className="no-events">
                        <Calendar size={48} />
                        <p>Aucun cours prévu à venir</p>
                    </div>
                ) : (
                    dayEvents.map((event, index) => {
                        const eventColor = getEventColor(event, colorSettings);
                        const isCancelled = isEventCancelled(event);

                        return (
                            <div
                                key={event._id || index}
                                className={`course-item ${isCancelled ? 'cancelled' : ''}`}
                                onClick={() => onEventClick && onEventClick(event)}
                                style={{ '--event-color': eventColor }}
                            >
                                <div className="course-time">
                                    <Clock size={16} />
                                    <span>{formatTime(event.start)}</span>
                                    <span className="duration">({formatDuration(event.start, event.end)})</span>
                                </div>

                                <div className="course-content">
                                    <h4 className="course-title">{event.title}</h4>
                                    {event.location && (
                                        <div className="course-location">
                                            <MapPin size={14} />
                                            <span>{event.location}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="course-indicator" style={{ backgroundColor: eventColor }}></div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default DailyCoursesList;

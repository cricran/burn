import { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar } from 'lucide-react';
import './dailyCoursesList.css';
import useCalendarStore from '../../utils/calendarStore';
import useColorSettingsStore from '../../utils/colorSettingsStore';
import { getEventColor, cleanCourseTitle, isEventCancelled } from '../../utils/colorUtils';

function DailyCoursesList({ onEventClick }) {
    const [todayEvents, setTodayEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { currentEvents } = useCalendarStore();
    const { colorSettings } = useColorSettingsStore();

    useEffect(() => {
        const loadTodayEvents = () => {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            // Filtrer les événements d'aujourd'hui
            const events = currentEvents.filter(event => {
                const eventDate = new Date(event.start).toISOString().split('T')[0];
                return eventDate === todayStr;
            });

            // Trier par heure de début
            events.sort((a, b) => new Date(a.start) - new Date(b.start));

            setTodayEvents(events);
            setIsLoading(false);
        };

        loadTodayEvents();
    }, [currentEvents]);

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
                <span className="event-count">{todayEvents.length} cours</span>
            </div>

            <div className="courses-container">
                {todayEvents.length === 0 ? (
                    <div className="no-events">
                        <Calendar size={48} />
                        <p>Aucun cours prévu aujourd'hui</p>
                    </div>
                ) : (
                    todayEvents.map((event, index) => {
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

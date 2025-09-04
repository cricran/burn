import { useState, useEffect } from 'react';
import { List } from 'lucide-react';
import './simpleCoursesList.css';
import useCalendarStore from '../../utils/calendarStore';
import useColorSettingsStore from '../../utils/colorSettingsStore';
import { getEventColor, cleanCourseTitle, isEventCancelled } from '../../utils/colorUtils';

function SimpleCoursesList({ onEventClick }) {
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

    if (isLoading) {
        return (
            <div className="simple-courses-list">
                <div className="module-header">
                    <h3>Liste des cours</h3>
                </div>
                <div className="loading">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="simple-courses-list">
            <div className="module-header">
                <h3>Liste des cours</h3>
                <span className="event-count">{todayEvents.length} cours</span>
            </div>

            <div className="courses-list">
                {todayEvents.length === 0 ? (
                    <div className="no-events">
                        <List size={48} />
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
                            >
                                <div className="course-info">
                                    <div className="course-time">
                                        {formatTime(event.start)}
                                    </div>
                                    <div className="course-details">
                                        <div className="course-title">{event.title}</div>
                                        {event.location && (
                                            <div className="course-location">{event.location}</div>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="course-color-indicator"
                                    style={{ backgroundColor: eventColor }}
                                ></div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default SimpleCoursesList;

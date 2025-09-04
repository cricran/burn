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

    const { currentEvents } = useCalendarStore();
    const { colorSettings } = useColorSettingsStore();

    // Filtrer les événements d'aujourd'hui seulement
    const todayEvents = useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        return currentEvents.filter(event => {
            const eventDate = new Date(event.start).toISOString().split('T')[0];
            return eventDate === todayStr;
        });
    }, [currentEvents]);

    useEffect(() => {
        setIsLoading(false);
    }, [currentEvents]);

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
                <span className="event-count">{todayEvents.length} cours</span>
            </div>

            <div className="calendar-container">
                {todayEvents.length === 0 ? (
                    <div className="no-events">
                        <Clock size={48} />
                        <p>Aucun cours prévu aujourd'hui</p>
                    </div>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={todayEvents}
                        defaultView='day'
                        views={['day']}
                        view='day'
                        date={currentDate}
                        startAccessor='start'
                        endAccessor='end'
                        min={new Date(2025, 0, 1, 8, 0)}
                        max={new Date(2025, 0, 1, 19, 0)}
                        culture='fr'
                        style={{ height: '400px' }}
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

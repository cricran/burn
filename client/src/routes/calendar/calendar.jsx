import './calendar.css'
import WeekCalendar from '../../components/weekCalendar/weekCalendar'
import Notes from '../../components/notes/notes'
import ColorPicker from '../../components/colorPicker/colorPicker'
import { useState } from 'react'
import EventDetails from '../../components/eventDetails/eventDetails'
import useAuthStore from '../../utils/authStore'
import useCalendarStore from '../../utils/calendarStore'

const Calendar = () => {
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showEventDetails, setShowEventDetails] = useState(false)
    const [updateKey, setUpdateKey] = useState(0)
    const { currentUser } = useAuthStore()
    const { currentEvents, fetchEvents } = useCalendarStore()

    const handleEventClick = (event) => {
        setSelectedEvent(event)
        setShowEventDetails(true)
    }

    const handleCloseEventDetails = () => {
        setShowEventDetails(false)
        setSelectedEvent(null)
    }

    // Fonction pour mettre à jour l'événement sélectionné après modification
    const handleEventUpdate = async () => {
        if (selectedEvent) {
            await fetchEvents();
            // Mettre à jour l'événement sélectionné avec la version fraîche du store
            const updatedEvents = useCalendarStore.getState().currentEvents || [];
            const updated = updatedEvents.find(e => e._id === selectedEvent._id);
            if (updated) setSelectedEvent(updated);
            // Forcer un re-render pour les consommateurs non réactifs
            setUpdateKey(prev => prev + 1);
        }
    }

    return (
        <div className='content'>
            <div className='calendar-dashboard'>
                {/* Header avec titre */}
                <div className='dashboard-header'>
                    <div className='dashboard-title'>
                        <h1>Emploi du temps</h1>
                        <p>Bonjour {currentUser?.username}, consultez votre planning</p>
                    </div>
                </div>

                <div className='calendar'>
                    <WeekCalendar onEventClick={handleEventClick} />
                    <Notes onEventClick={handleEventClick} />
                </div>
            </div>

            {showEventDetails && selectedEvent && (
                <EventDetails
                    key={`event-${selectedEvent._id}-${updateKey}`}
                    event={selectedEvent}
                    onClose={handleCloseEventDetails}
                    onEventUpdate={handleEventUpdate}
                    displayMode="modal"
                />
            )}
        </div>
    )
}

export default Calendar

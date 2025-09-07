import './calendar.css'
import WeekCalendar from '../../components/weekCalendar/weekCalendar'
import Notes from '../../components/notes/notes'
import ColorPicker from '../../components/colorPicker/colorPicker'
import { useState } from 'react'
import EventDetails from '../../components/eventDetails/eventDetails'
import useAuthStore from '../../utils/authStore'
import useCalendarStore from '../../utils/calendarStore'
import { Calendar as CalendarIcon, NotebookPen } from 'lucide-react'

const Calendar = () => {
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showEventDetails, setShowEventDetails] = useState(false)
    const [, setUpdateKey] = useState(0)
    const [activeTab, setActiveTab] = useState('calendar') // 'calendar' | 'notes' (mobile only)
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

                {/* Mobile tabs to switch between Calendar and Notes */}
                <div className='mobile-tabs' role='tablist' aria-label='Vue mobile calendrier et notes'>
                    <button
                        type='button'
                        role='tab'
                        aria-selected={activeTab === 'calendar'}
                        className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                        onClick={() => setActiveTab('calendar')}
                    >
                        <CalendarIcon size={18} />
                        <span>EDT</span>
                    </button>
                    <button
                        type='button'
                        role='tab'
                        aria-selected={activeTab === 'notes'}
                        className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notes')}
                    >
                        <NotebookPen size={18} />
                        <span>Notes</span>
                    </button>
                </div>

                <div className='calendar'>
                    <div className={`calendar-pane ${activeTab !== 'calendar' ? 'mobile-hidden' : ''}`}>
                        <WeekCalendar onEventClick={handleEventClick} />
                    </div>
                    <div className={`notes-pane ${activeTab !== 'notes' ? 'mobile-hidden' : ''}`}>
                        <Notes onEventClick={handleEventClick} />
                    </div>
                </div>
            </div>

            {showEventDetails && selectedEvent && (
                <EventDetails
                    key={`event-${selectedEvent._id}`}
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

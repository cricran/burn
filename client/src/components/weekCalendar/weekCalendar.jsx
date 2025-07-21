import './weekCalendar.css'
import { CalendarPlus, CalendarCog } from 'lucide-react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addWeeks } from 'date-fns'
import fr from 'date-fns/locale/fr'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState, useCallback, useEffect } from 'react'
import AddCalendar from '../../components/addCalendar/addCalendar'
import SettingCalendar from '../../components/settingCalendar/settingCalendar'
import EventDetails from '../../components/eventDetails/eventDetails'
import useCalendarStore from '../../utils/calendarStore'
import useNotificationStore from '../../utils/notificationStore'

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

const eventStyleGetter = (event) => {
  const style = {
    backgroundColor: '#0156619a',
    borderRadius: '6px',
    color: 'white',
    padding: '2px 6px',
    border: 'none',
    fontSize: '0.75rem',
    width: '100%',
  }
  return { style }
}

// Barre d'outils personnalisée
const MonToolbar = ({ label, onNavigate }) => (
  <div className="rbc-toolbar">
    <span className="rbc-btn-group">
      <button type="button" onClick={() => onNavigate('PREV')}>Précédent</button>
      <button type="button" onClick={() => onNavigate('TODAY')}>Aujourd'hui</button>
      <button type="button" onClick={() => onNavigate('NEXT')}>Suivant</button>
    </span>
    <span className="rbc-toolbar-label">{label}</span>
  </div>
);

function WeekCalendar() {
  const [showAdd, setShowAdd] = useState(false);
  const [showSetting, setShowSetting] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null); // Stocker l'ID au lieu de l'événement
  
  // Utiliser le store pour les événements et la date
  const { 
    currentEvents, 
    currentDate, 
    setCurrentDate, 
    fetchEvents, 
    isLoading 
  } = useCalendarStore();
  
  // Récupérer l'événement sélectionné à partir de son ID
  const selectedEvent = selectedEventId 
    ? currentEvents.find(e => e._id === selectedEventId) 
    : null;
    
  const notify = useNotificationStore(state => state.notify);

  // Récupérer les événements au chargement et quand la date change
  useEffect(() => {
    fetchEvents().catch(err => {
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible de récupérer les événements",
        duration: 5000
      });
    });
  }, [currentDate, fetchEvents, notify]);

  // Navigation entre les semaines
  const handleNavigate = useCallback((newDate) => {
    if (typeof newDate === 'string') {
      switch(newDate) {
        case 'PREV':
          setCurrentDate(addWeeks(currentDate, -1));
          break;
        case 'NEXT':
          setCurrentDate(addWeeks(currentDate, 1));
          break;
        case 'TODAY':
          setCurrentDate(new Date());
          break;
        default:
          break;
      }
    } else {
      // Si on reçoit une date (du calendrier lui-même)
      setCurrentDate(newDate);
    }
  }, [currentDate, setCurrentDate]);

  // Gérer l'ajout d'un calendrier (invalidation du cache)
  const handleAddCalendar = useCallback(() => {
    setShowAdd(true);
  }, []);

  // Gérer le clic sur un événement - stocke uniquement l'ID
  const handleSelectEvent = useCallback((event) => {
    setSelectedEventId(event._id);
  }, []);

  // Fermer le popup des détails d'événement
  const handleCloseEventDetails = useCallback(() => {
    setSelectedEventId(null);
  }, []);

  return (
    <div>
      {showAdd && (
        <AddCalendar 
          onClose={() => {
            setShowAdd(false);
            // Forcer le rafraîchissement des événements
            fetchEvents(true);
          }} 
        />
      )}
      
      {showSetting && (
        <SettingCalendar 
          onClose={() => {
            setShowSetting(false);
            // Forcer le rafraîchissement des événements
            fetchEvents(true);
          }} 
        />
      )}
      
      {selectedEvent && (
        <EventDetails 
          event={selectedEvent} 
          onClose={handleCloseEventDetails} 
        />
      )}
      
      <div className='weekCalendar'>
        <header>
          <h1>Emploi du temps</h1>
          <div className='options'>
            <div className='option' onClick={handleAddCalendar}>
              <CalendarPlus size={20} />
              Ajouter
            </div>
            <div className='option' onClick={() => setShowSetting(true)}>
              <CalendarCog size={20} />
              Paramètres
            </div>
          </div>
        </header>
        <div className='wcContent'>
          <Calendar
            localizer={localizer}
            events={currentEvents}
            defaultView='week'
            views={['week']}
            view='week'
            date={currentDate}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            startAccessor='start'
            endAccessor='end'
            min={new Date(2025, 0, 1, 7, 0)}
            max={new Date(2025, 0, 1, 21, 0)}
            culture='fr'
            style={{ height: '80vh' }}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: MonToolbar
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default WeekCalendar
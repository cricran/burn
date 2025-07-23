import './weekCalendar.css'
import { CalendarPlus, CalendarCog } from 'lucide-react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addWeeks } from 'date-fns'
import fr from 'date-fns/locale/fr'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState, useCallback, useEffect, useMemo } from 'react'
import AddCalendar from '../../components/addCalendar/addCalendar'
import SettingCalendar from '../../components/settingCalendar/settingCalendar'
import EventDetails from '../../components/eventDetails/eventDetails'
import useCalendarStore from '../../utils/calendarStore'
import useNotificationStore from '../../utils/notificationStore'
import useColorSettingsStore from '../../utils/colorSettingsStore'
import { getEventColor, isEventCancelled, getOptimalTextColor } from '../../utils/colorUtils'

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
  const [selectedEventId, setSelectedEventId] = useState(null);
  
  // Utiliser le store pour les événements et la date
  const { 
    currentEvents, 
    currentDate, 
    setCurrentDate, 
    fetchEvents, 
    isLoading 
  } = useCalendarStore();
  
  // Store pour les paramètres de couleur
  const { colorSettings, loadColorSettings } = useColorSettingsStore();
  
  // Filtrer les événements selon les paramètres
  const filteredEvents = useMemo(() => {
    if (colorSettings.showCancelledEvents) {
      return currentEvents;
    }
    return currentEvents.filter(event => !isEventCancelled(event));
  }, [currentEvents, colorSettings.showCancelledEvents]);

  // Récupérer l'événement sélectionné à partir de son ID
  const selectedEvent = selectedEventId 
    ? currentEvents.find(e => e._id === selectedEventId) 
    : null;
    
  const notify = useNotificationStore(state => state.notify);

  // Fonction pour styliser les événements avec les couleurs et contraste optimal
  const eventStyleGetter = useCallback((event) => {
    const eventColor = getEventColor(event, colorSettings);
    const isCancelled = isEventCancelled(event);
    const textColor = getOptimalTextColor(eventColor);
    
    const style = {
      backgroundColor: eventColor,
      borderRadius: '6px',
      color: textColor, // Couleur de texte automatique
      padding: '2px 6px',
      border: 'none',
      fontSize: '0.75rem',
      width: '100%',
      fontWeight: '500', // Améliorer la lisibilité
      // Ajouter des hachures pour les événements annulés
      ...(isCancelled && {
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, ${textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} 2px, ${textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} 4px)`,
        opacity: 0.7
      })
    }
    return { style }
  }, [colorSettings]);

  // Récupérer les événements et paramètres de couleur au chargement
  useEffect(() => {
    fetchEvents().catch(err => {
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible de récupérer les événements",
        duration: 5000
      });
    });
    
    loadColorSettings();
  }, [currentDate, fetchEvents, notify, loadColorSettings]);

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
      setCurrentDate(newDate);
    }
  }, [currentDate, setCurrentDate]);

  // Gérer l'ajout d'un calendrier
  const handleAddCalendar = useCallback(() => {
    setShowAdd(true);
  }, []);

  // Gérer le clic sur un événement
  const handleSelectEvent = useCallback((event) => {
    setSelectedEventId(event._id);
  }, []);

  // Fermer le popup des détails d'événement
  const handleCloseEventDetails = useCallback(() => {
    setSelectedEventId(null);
  }, []);

  // Gérer la fermeture des paramètres avec rechargement des couleurs
  const handleCloseSettings = useCallback(() => {
    setShowSetting(false);
    fetchEvents(true);
    // Pas besoin de recharger les colorSettings car le store se met à jour automatiquement
  }, [fetchEvents]);

  return (
    <div>
      {showAdd && (
        <AddCalendar 
          onClose={() => {
            setShowAdd(false);
            fetchEvents(true);
          }} 
        />
      )}
      
      {showSetting && (
        <SettingCalendar 
          onClose={handleCloseSettings}
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
            events={filteredEvents} // Utiliser les événements filtrés
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
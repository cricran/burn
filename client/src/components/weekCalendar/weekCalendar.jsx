import './weekCalendar.css'
import { CalendarPlus, CalendarCog, MapPin } from 'lucide-react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addWeeks } from 'date-fns'
import fr from 'date-fns/locale/fr'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useSwipeable } from 'react-swipeable'
import AddCalendar from '../addCalendar/addCalendar'
import SettingCalendar from '../settingCalendar/settingCalendar'
import useCalendarStore from '../../utils/calendarStore'
import useNotificationStore from '../../utils/notificationStore'
import useColorSettingsStore from '../../utils/colorSettingsStore'
import useHiddenEventsStore from '../../utils/hiddenEventsStore'
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

function WeekCalendar({ onEventClick }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showSetting, setShowSetting] = useState(false);
  
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
  
  // Store pour les événements masqués
  const { loadHiddenEvents } = useHiddenEventsStore();
  
  // Filtrer les événements selon les paramètres
  const filteredEvents = useMemo(() => {
    if (colorSettings.showCancelledEvents) {
      return currentEvents;
    }
    return currentEvents.filter(event => !isEventCancelled(event));
  }, [currentEvents, colorSettings.showCancelledEvents]);
    
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
    // Avoid duplicate fetch if Home prefetch already warmed cache; fetchEvents() itself caches
    fetchEvents().catch(err => {
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible de récupérer les événements",
        duration: 5000
      });
    });
    
    loadColorSettings();
    loadHiddenEvents();
  }, [currentDate, fetchEvents, notify, loadColorSettings, loadHiddenEvents]);

  // Ensure swipe animations are properly cleaned up on window blur/focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        resetSwipeState();
      }
    };
    
    const handleWindowBlur = () => resetSwipeState();
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    
    return () => {
      // Clean up listeners on unmount
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      resetSwipeState();
    };
  }, []);

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
    if (onEventClick) {
      onEventClick(event);
    }
  }, [onEventClick]);

  // Gérer la fermeture des paramètres avec rechargement des couleurs
  const handleCloseSettings = useCallback(() => {
    setShowSetting(false);
    // Force refresh only if necessary; cache will be used otherwise
    fetchEvents();
    // Pas besoin de recharger les colorSettings car le store se met à jour automatiquement
  }, [fetchEvents]);

  // Enhanced swipe state management
  const swipeStateRef = useRef({
    isSwiping: false,
    startX: 0,
    currentX: 0,
    velocity: 0,
    lastTime: 0,
    direction: null
  });

  // Configuration des gestionnaires de swipe pour la navigation mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (Math.abs(eventData.deltaX) > 50) { // Only navigate if swipe is significant
        // Add success animation
        const container = document.querySelector('.wcContent');
        if (container) {
          container.classList.add('swipe-success');
          setTimeout(() => {
            container.classList.remove('swipe-success');
          }, 300);
        }
        handleNavigate('NEXT');
      }
      resetSwipeState();
    },
    onSwipedRight: (eventData) => {
      if (Math.abs(eventData.deltaX) > 50) { // Only navigate if swipe is significant
        // Add success animation
        const container = document.querySelector('.wcContent');
        if (container) {
          container.classList.add('swipe-success');
          setTimeout(() => {
            container.classList.remove('swipe-success');
          }, 300);
        }
        handleNavigate('PREV');
      }
      resetSwipeState();
    },
    onSwiping: (event) => {
      const container = document.querySelector('.wcContent');
      if (!container) return;
      
      // Update swipe state
      const now = Date.now();
      const deltaTime = now - swipeStateRef.current.lastTime;
      swipeStateRef.current.velocity = (event.deltaX - swipeStateRef.current.currentX) / deltaTime;
      swipeStateRef.current.currentX = event.deltaX;
      swipeStateRef.current.lastTime = now;
      swipeStateRef.current.isSwiping = true;
      
      // Clear any transition to make it feel responsive during the swipe
      container.style.transition = 'none';
      
      // Add classes based on swipe direction
      if (event.dir === 'Left') {
        container.classList.add('swiping-left');
        container.classList.remove('swiping-right');
        swipeStateRef.current.direction = 'left';
        
        // Apply real-time translation with resistance for more realistic feel
        const resistance = Math.max(0, 1 - Math.abs(event.deltaX) / 300); // Resistance increases with distance
        const moveX = Math.min(event.deltaX * -0.4 * resistance, 0); // Limit to negative values for left swipe
        container.style.transform = `translateX(${moveX}px) scale(${1 - Math.abs(moveX) / 2000})`;
        
        // Add momentum-based opacity for edge indicator
        const edgeOpacity = Math.min(Math.abs(event.deltaX) / 100, 1);
        container.style.setProperty('--edge-opacity', edgeOpacity);
        
        // Add resistance class when swiping beyond threshold
        if (Math.abs(event.deltaX) > 150) {
          container.classList.add('resisting');
        } else {
          container.classList.remove('resisting');
        }
        
      } else if (event.dir === 'Right') {
        container.classList.add('swiping-right');
        container.classList.remove('swiping-left');
        swipeStateRef.current.direction = 'right';
        
        // Apply real-time translation with resistance for more realistic feel
        const resistance = Math.max(0, 1 - Math.abs(event.deltaX) / 300); // Resistance increases with distance
        const moveX = Math.max(event.deltaX * 0.4 * resistance, 0); // Limit to positive values for right swipe
        container.style.transform = `translateX(${moveX}px) scale(${1 - Math.abs(moveX) / 2000})`;
        
        // Add momentum-based opacity for edge indicator
        const edgeOpacity = Math.min(Math.abs(event.deltaX) / 100, 1);
        container.style.setProperty('--edge-opacity', edgeOpacity);
        
        // Add resistance class when swiping beyond threshold
        if (Math.abs(event.deltaX) > 150) {
          container.classList.add('resisting');
        } else {
          container.classList.remove('resisting');
        }
      }
    },
    onSwiped: (eventData) => {
      // Add momentum animation if swipe was fast enough
      const container = document.querySelector('.wcContent');
      if (container && Math.abs(swipeStateRef.current.velocity) > 0.5) {
        const momentumDistance = swipeStateRef.current.velocity * 50; // Calculate momentum distance
        const finalTransform = swipeStateRef.current.direction === 'left' 
          ? Math.min(momentumDistance, 0) 
          : Math.max(momentumDistance, 0);
        
        container.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // Bounce easing
        container.style.transform = `translateX(${finalTransform}px) scale(${1 - Math.abs(finalTransform) / 2000})`;
        
        // Reset after momentum animation
        setTimeout(() => {
          resetSwipeState();
        }, 300);
      } else {
        resetSwipeState();
      }
    },
    onTouchEndOrOnMouseUp: resetSwipeState,
    onCanceled: resetSwipeState,
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
    trackTouch: true,
    delta: 10, // Minimum swipe distance (Material Design typical)
    swipeDuration: 300, // Maximum time in ms to swipe (Android standard is typically 300ms)
  });
  
  // Ensure we always clean up swipe state to prevent UI getting stuck
  function resetSwipeState() {
    const container = document.querySelector('.wcContent');
    if (!container) return;
    
    // Reset swipe state
    swipeStateRef.current = {
      isSwiping: false,
      startX: 0,
      currentX: 0,
      velocity: 0,
      lastTime: 0,
      direction: null
    };
    
    // First reset transform to use CSS transitions
    requestAnimationFrame(() => {
      // Restore transition for the return animation with spring-like easing
      container.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      container.style.transform = 'translateX(0) scale(1)';
      
      // Reset CSS variables
      container.style.setProperty('--edge-opacity', '0');
      
      // Remove swiping classes
      container.classList.remove('swiping-left');
      container.classList.remove('swiping-right');
      container.classList.remove('resisting');
    });
  }

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
          {/* Current week indicator for mobile */}
          <div className="mobile-week-indicator">
            <button className="mobile-nav-btn" onClick={() => handleNavigate('PREV')}>←</button>
            <span>
              {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM', { locale: fr })} - {format(addWeeks(startOfWeek(currentDate, { weekStartsOn: 1 }), 1) - 1, 'dd MMM', { locale: fr })}
            </span>
            <button className="mobile-nav-btn" onClick={() => handleNavigate('NEXT')}>→</button>
          </div>
        </header>
        <div className='wcContent' {...swipeHandlers}>
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
              toolbar: MonToolbar,
              event: ({ event }) => (
                <div className="custom-event-content">
                  <div className="event-title" title={event.title}>{event.title}</div>
                  <div className="event-time">
                    {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                  </div>
                  {event.location && (
                    <div className="event-location" title={event.location}>
                      <MapPin size={10} />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              )
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default WeekCalendar
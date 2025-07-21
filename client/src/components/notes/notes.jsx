import './notes.css'
import GroupNotes from '../groupNotes/groupNotes'
import EventDetails from '../eventDetails/eventDetails'
import useCalendarStore from '../../utils/calendarStore'
import { useEffect, useState, useMemo } from 'react'

function Notes() {
  const { currentEvents, isLoading } = useCalendarStore();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  
  // Récupérer l'événement sélectionné à partir de son ID
  const selectedEvent = selectedEventId 
    ? currentEvents.find(e => e._id === selectedEventId) 
    : null;
  
  // Marquer le chargement initial comme terminé
  useEffect(() => {
    if (currentEvents.length > 0 && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [currentEvents, initialLoadDone]);
  
  // Utiliser useMemo pour calculer les données de notes uniquement quand currentEvents change
  const notesData = useMemo(() => {
    // Regrouper par jour
    const groupedByDay = {};
    
    currentEvents.forEach(event => {
      if (event.tasks && event.tasks.length > 0) {
        const day = event.start.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
        
        if (!groupedByDay[day]) {
          groupedByDay[day] = [];
        }
        
        groupedByDay[day].push({
          name: event.title,
          eventId: event._id,
          // Utiliser un identifiant stable pour chaque note
          tasks: event.tasks.map((task, index) => ({
            ...task,
            id: `${event._id}-${index}`
          }))
        });
      }
    });
    
    // Convertir en format pour les composants
    return Object.keys(groupedByDay).map(day => ({
      title: day,
      notes: groupedByDay[day]
    }));
  }, [currentEvents]);

  // Fonction pour ouvrir EventDetails
  const handleOpenEventDetails = (eventId) => {
    setSelectedEventId(eventId);
  };

  // Fonction pour fermer EventDetails
  const handleCloseEventDetails = () => {
    setSelectedEventId(null);
  };

  // Montrer l'indicateur de chargement uniquement lors du chargement initial
  const showLoading = isLoading && !initialLoadDone;
  // Montrer le message "aucune note" uniquement si le chargement initial est terminé et qu'il n'y a pas de notes
  const showEmpty = initialLoadDone && notesData.length === 0;

  return (
    <div className='notes'>
      <header>
        <h1>Notes</h1>
        <div className='options'></div>
      </header>
      <div className='nContent'>
        {showLoading ? (
          <div className="loading">Chargement des notes...</div>
        ) : showEmpty ? (
          <div className="empty-notes">
            Aucune note pour cette semaine
          </div>
        ) : (
          notesData.map((data, index) => (
            // Utiliser un identifiant stable pour chaque jour
            <GroupNotes 
              key={`day-${data.title}`} 
              data={data} 
              onOpenEventDetails={handleOpenEventDetails}
            />
          ))
        )}
      </div>
      
      {selectedEvent && (
        <EventDetails 
          event={selectedEvent} 
          onClose={handleCloseEventDetails} 
        />
      )}
    </div>
  )
}

export default Notes

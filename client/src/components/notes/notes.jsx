import './notes.css'
import GroupNotes from '../groupNotes/groupNotes'
import useCalendarStore from '../../utils/calendarStore'
import { useEffect, useState, useMemo } from 'react'
import { startOfWeek, endOfWeek, startOfDay } from 'date-fns'

function Notes({ onEventClick }) {
  const { currentEvents, isLoading } = useCalendarStore();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Marquer le chargement initial comme terminé
  useEffect(() => {
    if (currentEvents.length > 0 && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [currentEvents, initialLoadDone]);
  
  // Utiliser useMemo pour calculer les données de notes uniquement quand currentEvents change
  const notesData = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Group by normalized day key for sorting
    const groupedByDay = new Map(); // key: YYYY-MM-DD, value: { date: Date, items: [] }

    currentEvents.forEach(event => {
      const hasTasks = Array.isArray(event.tasks) && event.tasks.length > 0;
      if (!hasTasks) return;

      const start = new Date(event.start);
      // Only today and future this week
      if (start < today || start > weekEnd) return;

      // Hide section if all tasks are done
      const allDone = event.tasks.every(t => !!t.done);
      if (allDone) return;

      const dayDate = startOfDay(start);
      const y = dayDate.getFullYear();
      const m = String(dayDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayDate.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;

      if (!groupedByDay.has(key)) {
        groupedByDay.set(key, { date: dayDate, items: [] });
      }

      groupedByDay.get(key).items.push({
        name: event.title,
        eventId: event._id,
        eventStart: start.getTime(),
        tasks: event.tasks.map((task, index) => ({
          ...task,
          id: `${event._id}-${index}`
        }))
      });
    });

    // Build sorted array: days ascending, events ascending
    const days = Array.from(groupedByDay.entries())
      .sort((a, b) => a[1].date - b[1].date)
      .map(([key, { date, items }]) => {
        const title = date.toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long'
        });
        const notes = items
          .sort((a, b) => a.eventStart - b.eventStart)
          .map(({ eventId, name, tasks }) => ({ eventId, name, tasks }));
        return { title, notes };
      });

    return days;
  }, [currentEvents]);

  // Fonction pour ouvrir EventDetails
  const handleOpenEventDetails = (eventId) => {
    const event = currentEvents.find(e => e._id === eventId);
    if (event && onEventClick) {
      onEventClick(event);
    }
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
    </div>
  )
}

export default Notes

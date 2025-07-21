import { Calendar, Clock, MapPin, NotebookPen, X, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import './eventDetails.css';
import useCalendarStore from '../../utils/calendarStore';
import useNotificationStore from '../../utils/notificationStore';

function EventDetails({ event: initialEvent, onClose }) {
  const [newNote, setNewNote] = useState('');
  const { addNote, toggleNote, deleteNote, currentEvents } = useCalendarStore();
  const notify = useNotificationStore(state => state.notify);
  
  // Utiliser l'événement du store pour avoir les dernières mises à jour
  const event = currentEvents.find(e => e._id === initialEvent._id) || initialEvent;
  
  // Formater la date
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  // Formater l'heure
  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  // Gérer l'ajout d'une note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const result = await addNote(event._id, newNote.trim());
      if (result.success) {
        setNewNote('');
      } else {
        notify({
          type: "error",
          title: "Erreur",
          message: "Impossible d'ajouter la note",
          duration: 5000
        });
      }
    } catch (error) {
      notify({
        type: "error",
        title: "Erreur",
        message: "Une erreur est survenue",
        duration: 5000
      });
    }
  };

  // Gérer le toggle d'une note
  const handleToggleNote = async (index, currentStatus) => {
    try {
      await toggleNote(event._id, index, !currentStatus);
    } catch (error) {
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible de modifier la note",
        duration: 5000
      });
    }
  };

  // Gérer la suppression d'une note
  const handleDeleteNote = async (index) => {
    try {
      await deleteNote(event._id, index);
    } catch (error) {
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible de supprimer la note",
        duration: 5000
      });
    }
  };

  // Empêcher la propagation du clic
  const stopPropagation = (e) => {
    e.stopPropagation();
  };
  
  // Fermer sur la touche Echap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="event-details-overlay" onClick={onClose}>
      <div className="event-details-content" onClick={stopPropagation}>
        <button className="event-details-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <h2 className="event-details-title">{event.title}</h2>
        
        <div className="event-details-info">
          <div className="event-info-item">
            <Calendar size={18} />
            <span>{formatDate(event.start)}</span>
          </div>
          
          <div className="event-info-item">
            <Clock size={18} />
            <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
          </div>
          
          {event.location && (
            <div className="event-info-item">
              <MapPin size={18} />
              <span>{event.location}</span>
            </div>
          )}
        </div>
        
        <div className="event-details-description">
          {event.description && (
            <div className="event-description-text">
              <p>{event.description}</p>
            </div>
          )}
        </div>
        
        <div className="event-details-notes">
          <h3>
            <NotebookPen size={18} />
            <span>Notes</span>
          </h3>
          
          <div className="event-notes-list">
            {(event.tasks && event.tasks.length > 0) ? (
              event.tasks.map((task, index) => (
                <div className="event-note-item" key={index}>
                  <input 
                    type="checkbox" 
                    checked={task.done} 
                    onChange={() => handleToggleNote(index, task.done)}
                  />
                  <p>{task.text}</p>
                  <button 
                    className="event-note-delete" 
                    onClick={() => handleDeleteNote(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <p className="event-no-notes">Aucune note pour cet événement</p>
            )}
          </div>
          
          <div className="event-add-note">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajouter une note..."
              className="event-note-input"
              onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <button className="event-note-add-btn" onClick={handleAddNote}>
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
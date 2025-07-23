import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, NotebookPen, X, Trash2, Plus } from 'lucide-react';
import './eventDetails.css';
import apiRequest from '../../utils/apiRequest';
import useNotificationStore from '../../utils/notificationStore';
import useColorSettingsStore from '../../utils/colorSettingsStore';
import { getEventColor, cleanCourseTitle } from '../../utils/colorUtils';
import ColorPicker from '../colorPicker/colorPicker';

function EventDetails({ event: initialEvent, onClose }) {
  const [event, setEvent] = useState(initialEvent);
  const [newNote, setNewNote] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const notify = useNotificationStore(state => state.notify);
  const { colorSettings, setCustomColor } = useColorSettingsStore();
  
  // Obtenir la couleur de l'événement
  const eventColor = getEventColor(event, colorSettings);
  
  // Vérifier si on peut personnaliser la couleur (mode individual uniquement)
  const canCustomizeColor = colorSettings.mode === 'individual';

  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await apiRequest.post(`/calendar/${event._id}/tasks`, {
        text: newNote.trim()
      });

      setEvent(prev => ({
        ...prev,
        tasks: response.data.tasks
      }));

      setNewNote('');
      notify({
        type: "success",
        title: "Note ajoutée",
        message: "La note a été ajoutée avec succès",
        duration: 3000
      });
    } catch (error) {
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible d'ajouter la note",
        duration: 5000
      });
    }
  };

  const handleToggleNote = async (noteIndex, currentStatus) => {
    try {
      const response = await apiRequest.put(`/calendar/${event._id}/tasks/${noteIndex}`, {
        done: !currentStatus
      });

      setEvent(prev => ({
        ...prev,
        tasks: response.data.tasks
      }));
    } catch (error) {
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible de modifier la note",
        duration: 5000
      });
    }
  };

  const handleDeleteNote = async (noteIndex) => {
    try {
      const response = await apiRequest.delete(`/calendar/${event._id}/tasks/${noteIndex}`);

      setEvent(prev => ({
        ...prev,
        tasks: response.data.tasks
      }));

      notify({
        type: "success",
        title: "Note supprimée",
        message: "La note a été supprimée",
        duration: 3000
      });
    } catch (error) {
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible de supprimer la note",
        duration: 5000
      });
    }
  };

  // Gérer le changement de couleur personnalisée
  const handleColorChange = async (newColor) => {
    const cleanTitle = cleanCourseTitle(event.title);
    try {
      await setCustomColor(cleanTitle, newColor);
      notify({
        type: "success",
        title: "Couleur mise à jour",
        message: "La couleur du cours a été modifiée",
        duration: 3000
      });
    } catch (error) {
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible de modifier la couleur",
        duration: 5000
      });
    }
  };

  return (
    <div className="event-details-overlay" onClick={onClose}>
      {showColorPicker && (
        <ColorPicker
          currentColor={eventColor}
          onColorChange={handleColorChange}
          onClose={() => setShowColorPicker(false)}
          eventTitle={cleanCourseTitle(event.title)}
        />
      )}
      
      <div className="event-details-content" onClick={stopPropagation}>
        <button className="event-details-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <h2 className="event-details-title">
          <span 
            className={`event-details-color ${canCustomizeColor ? 'clickable' : ''}`}
            style={{ backgroundColor: eventColor }}
            onClick={canCustomizeColor ? () => setShowColorPicker(true) : undefined}
            title={canCustomizeColor ? "Cliquer pour changer la couleur" : ""}
          ></span>
          {event.title}
        </h2>
        
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
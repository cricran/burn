import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, NotebookPen, X, Trash2, Plus, Loader, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import './eventDetails.css';
import useCalendarStore from '../../utils/calendarStore';
import useNotificationStore from '../../utils/notificationStore';
import useColorSettingsStore from '../../utils/colorSettingsStore';
import useHiddenEventsStore from '../../utils/hiddenEventsStore';
import { getEventColor, cleanCourseTitle, isEventCancelled } from '../../utils/colorUtils';
import ColorPicker from '../colorPicker/colorPicker';

function EventDetails({ event: initialEvent, onClose, onEventUpdate, displayMode = 'modal' }) {
  const [event, setEvent] = useState(initialEvent);
  const [newNote, setNewNote] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // États locaux pour suivre les opérations en cours (comme dans note.jsx)
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [togglingNoteIndex, setTogglingNoteIndex] = useState(null);
  const [deletingNoteIndex, setDeletingNoteIndex] = useState(null);
  
  // États pour les opérations de masquage
  const [isHidingIndividual, setIsHidingIndividual] = useState(false);
  const [isHidingByName, setIsHidingByName] = useState(false);
  
  const notify = useNotificationStore(state => state.notify);
  const { colorSettings, setCustomColor } = useColorSettingsStore();
  const { hideIndividualEvent, hideEventsByName, hiddenEvents } = useHiddenEventsStore();
  const { invalidateCache } = useCalendarStore();
  
  // Utiliser les fonctions du store comme dans note.jsx
  const { addNote, toggleNote, deleteNote } = useCalendarStore();
  
  // Obtenir la couleur de l'événement
  const eventColor = getEventColor(event, colorSettings);
  
  // Vérifier si on peut personnaliser la couleur (mode individual uniquement)
  const canCustomizeColor = colorSettings.mode === 'individual';

  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);

  // Effet pour forcer la mise à jour quand les tâches changent
  useEffect(() => {
    if (initialEvent && initialEvent.tasks) {
      setEvent(prevEvent => ({
        ...prevEvent,
        tasks: initialEvent.tasks
      }));
    }
  }, [initialEvent?.tasks]);

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

  // Ajouter une note sans notification de succès
  const handleAddNote = async () => {
    if (!newNote.trim() || isAddingNote) return;
    
    setIsAddingNote(true);
    try {
      // Mise à jour optimiste immédiate
      const optimisticTask = { text: newNote.trim(), done: false, _optimistic: true };
      const prevTasks = event.tasks || [];
      setEvent(prev => ({ ...prev, tasks: [...prevTasks, optimisticTask] }));

      const result = await addNote(event._id, newNote.trim());
      if (result.success) {
        // Remplacer par les tâches renvoyées par le serveur
        if (result.data?.tasks) setEvent(prev => ({ ...prev, tasks: result.data.tasks }));
        setNewNote('');
        // Notifier le parent que l'événement a été mis à jour
        if (onEventUpdate) {
          onEventUpdate();
        }
      } else {
        // Rollback
        setEvent(prev => ({ ...prev, tasks: prevTasks }));
        notify({
          type: "error",
          title: "Erreur",
          message: "Impossible d'ajouter la note",
          duration: 5000
        });
      }
    } catch (error) {
      // Rollback
      setEvent(prev => ({ ...prev, tasks: (prev.tasks || []).filter(t => !t._optimistic) }));
      notify({
        type: "error",
        title: "Erreur",
        message: "Une erreur est survenue",
        duration: 5000
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  // Gérer la touche Entrée pour ajouter une note
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Empêcher le saut de ligne
      handleAddNote();
    }
  };

  // Toggle note sans notification
  const handleToggleNote = async (noteIndex, currentStatus) => {
    if (togglingNoteIndex !== null) return;
    
    setTogglingNoteIndex(noteIndex);
    try {
      // Optimiste: inverser l'état localement
      const prevTasks = event.tasks || [];
      setEvent(prev => ({
        ...prev,
        tasks: prevTasks.map((t, i) => i === noteIndex ? { ...t, done: !currentStatus } : t)
      }));

      const result = await toggleNote(event._id, noteIndex, !currentStatus);
      if (result?.success && result.data?.tasks) {
        setEvent(prev => ({ ...prev, tasks: result.data.tasks }));
      } else {
        // Rollback
        setEvent(prev => ({ ...prev, tasks: prevTasks }));
      }
      // Notifier le parent que l'événement a été mis à jour
      if (onEventUpdate) {
        onEventUpdate();
      }
    } catch (error) {
      // Rollback
      setEvent(prev => ({ ...prev, tasks: (prev.tasks || []).map((t, i) => i === noteIndex ? { ...t, done: currentStatus } : t) }));
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible de modifier la note",
        duration: 5000
      });
    } finally {
      setTogglingNoteIndex(null);
    }
  };

    // Supprimer note sans notification de succès
  const handleDeleteNote = async (noteIndex) => {
    if (deletingNoteIndex !== null) return;
    
    setDeletingNoteIndex(noteIndex);
    try {
      // Optimiste: retirer la note localement
      const prevTasks = event.tasks || [];
      setEvent(prev => ({
        ...prev,
        tasks: prevTasks.filter((_, i) => i !== noteIndex)
      }));

      const result = await deleteNote(event._id, noteIndex);
      if (result?.success && result.data?.tasks) {
        setEvent(prev => ({ ...prev, tasks: result.data.tasks }));
      } else {
        // Rollback
        setEvent(prev => ({ ...prev, tasks: prevTasks }));
      }
      // Notifier le parent que l'événement a été mis à jour
      if (onEventUpdate) {
        onEventUpdate();
      }
      // Pas de notification de succès
    } catch (error) {
      // Rollback
      setEvent(prev => ({ ...prev, tasks: (prev.tasks || []) }));
      notify({
        type: "error",
        title: "Erreur",
        message: "Impossible de supprimer la note",
        duration: 5000
      });
    } finally {
      setDeletingNoteIndex(null);
    }
  };

  // Masquer cet événement individuellement
  const handleHideIndividual = async () => {
    if (isHidingIndividual) return;
    
    setIsHidingIndividual(true);
    try {
      const result = await hideIndividualEvent(event._id);
      if (result.success) {
        invalidateCache(); // Invalider le cache
        onClose(); // Fermer le popup après masquage
      }
    } catch (error) {
      console.error('Erreur lors du masquage de l\'événement:', error);
    } finally {
      setIsHidingIndividual(false);
    }
  };

  // Masquer tous les événements de ce nom
  const handleHideByName = async () => {
    if (isHidingByName) return;
    
    setIsHidingByName(true);
    try {
      const cleanTitle = cleanCourseTitle(event.title);
      const result = await hideEventsByName(cleanTitle);
      if (result.success) {
        invalidateCache(); // Invalider le cache
        onClose(); // Fermer le popup après masquage
      }
    } catch (error) {
      console.error('Erreur lors du masquage des événements:', error);
    } finally {
      setIsHidingByName(false);
    }
  };

  // Gérer le changement de couleur personnalisée
  const handleColorChange = async (newColor) => {
    const cleanTitle = cleanCourseTitle(event.title);
    try {
      await setCustomColor(cleanTitle, newColor);
      // Notifier le parent que l'événement a été mis à jour
      if (onEventUpdate) {
        onEventUpdate();
      }
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

  const eventTasks = event.tasks || [];
  const isCancelled = isEventCancelled(event); 

  if (displayMode === 'inline') {
    return (
      <div className="event-details-inline">
        {showColorPicker && (
          <ColorPicker
            currentColor={eventColor}
            onColorChange={handleColorChange}
            onClose={() => setShowColorPicker(false)}
            eventTitle={cleanCourseTitle(event.title)}
          />
        )}
        
        <div className="event-details-content-inline">
          <div className="event-details-header-inline">
            <h2 className="event-details-title">
              <span 
                className={`event-details-color ${canCustomizeColor ? 'clickable' : ''}`}
                style={{ backgroundColor: eventColor }}
                onClick={canCustomizeColor ? () => setShowColorPicker(true) : undefined}
                title={canCustomizeColor ? "Cliquer pour changer la couleur" : ""}
              ></span>
              {event.title}
            </h2>
            <button className="event-details-close-inline" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
          {isCancelled && (
            <div className="event-cancelled-warning">
              <AlertTriangle size={18} color="#FF0000" />
              <span>Cet événement est annulé.</span>
            </div>
          )}
          
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
          
          {/* Boutons de masquage */}
          <div className="event-details-actions">
            <button 
              className="event-action-btn hide-individual-btn"
              onClick={handleHideIndividual}
              disabled={isHidingIndividual}
              title="Masquer uniquement cet événement"
            >
              {isHidingIndividual ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <EyeOff size={16} />
              )}
              <span>Masquer uniquement ce cour</span>
            </button>
            
            <button 
              className="event-action-btn hide-by-name-btn"
              onClick={handleHideByName}
              disabled={isHidingByName}
              title="Masquer tous les événements de ce cours"
            >
              {isHidingByName ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <EyeOff size={16} />
              )}
              <span>Masquer tout les cours du même nom</span>
            </button>
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
              {(eventTasks.length > 0) ? (
                eventTasks.map((task, index) => (
                  <div className="event-note-item" key={task.id || `${event._id}-${index}`}>
                    <input 
                      type="checkbox" 
                      checked={task.done} 
                      onChange={() => handleToggleNote(index, task.done)}
                      disabled={togglingNoteIndex === index}
                    />
                    <p>{task.text}</p>
                    <button 
                      className="event-note-delete" 
                      onClick={() => handleDeleteNote(index)}
                      disabled={deletingNoteIndex === index}
                    >
                      {deletingNoteIndex === index ? 
                        <Loader size={16} className="animate-spin" /> : 
                        <Trash2 size={16} />
                      }
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
                onKeyDown={handleKeyDown}
                disabled={isAddingNote}
              />
              <button 
                className="event-note-add-btn" 
                onClick={handleAddNote}
                disabled={isAddingNote}
              >
                {isAddingNote ? 
                  <Loader size={18} className="animate-spin" /> : 
                  <Plus size={18} />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
         {isCancelled && (
          <div className="event-cancelled-warning">
            <AlertTriangle size={18} color="#FF0000" />
            <span>Cet événement est annulé.</span>
          </div>
        )}
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
        
        {/* Boutons de masquage */}
        <div className="event-details-actions">
          <button 
            className="event-action-btn hide-individual-btn"
            onClick={handleHideIndividual}
            disabled={isHidingIndividual}
            title="Masquer uniquement cet événement"
          >
            {isHidingIndividual ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <EyeOff size={16} />
            )}
            <span>Masquer uniquement ce cour</span>
          </button>
          
          <button 
            className="event-action-btn hide-by-name-btn"
            onClick={handleHideByName}
            disabled={isHidingByName}
            title="Masquer tous les événements de ce cours"
          >
            {isHidingByName ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <EyeOff size={16} />
            )}
            <span>Masquer tout les cours du même nom</span>
          </button>
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
            {(eventTasks.length > 0) ? (
              eventTasks.map((task, index) => (
                <div className="event-note-item" key={task.id || `${event._id}-${index}`}>
                  <input 
                    type="checkbox" 
                    checked={task.done} 
                    onChange={() => handleToggleNote(index, task.done)}
                    disabled={togglingNoteIndex === index}
                  />
                  <p>{task.text}</p>
                  <button 
                    className="event-note-delete" 
                    onClick={() => handleDeleteNote(index)}
                    disabled={deletingNoteIndex === index}
                  >
                    {deletingNoteIndex === index ? 
                      <Loader size={16} className="animate-spin" /> : 
                      <Trash2 size={16} />
                    }
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
              onKeyDown={handleKeyDown}
              disabled={isAddingNote}
            />
            <button 
              className="event-note-add-btn" 
              onClick={handleAddNote}
              disabled={isAddingNote}
            >
              {isAddingNote ? 
                <Loader size={18} className="animate-spin" /> : 
                <Plus size={18} />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
import './note.css'
import { NotebookPen, Trash2, Plus, Loader } from 'lucide-react'
import { useState } from 'react'
import useCalendarStore from '../../utils/calendarStore'
import useNotificationStore from '../../utils/notificationStore'

function Note({ eventId, title, tasks, onOpenEventDetails }) {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  // États locaux pour suivre les opérations en cours
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [togglingNoteIndex, setTogglingNoteIndex] = useState(null);
  const [deletingNoteIndex, setDeletingNoteIndex] = useState(null);
  
  const { addNote, toggleNote, deleteNote } = useCalendarStore();
  const notify = useNotificationStore(state => state.notify);
  
  // Récupérer les tâches directement depuis les props plutôt que depuis currentEvents
  const eventTasks = tasks || [];

  const handleAddNote = async () => {
    if (!newNote.trim() || isAddingNote) return;
    
    setIsAddingNote(true);
    try {
      const result = await addNote(eventId, newNote.trim());
      if (result.success) {
        setNewNote('');
        setIsAdding(false);
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

  const handleToggleNote = async (index, currentStatus) => {
    if (togglingNoteIndex !== null) return;
    
    setTogglingNoteIndex(index);
    try {
      await toggleNote(eventId, index, !currentStatus);
    } catch (error) {
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

  const handleDeleteNote = async (index) => {
    if (deletingNoteIndex !== null) return;
    
    setDeletingNoteIndex(index);
    try {
      await deleteNote(eventId, index);
    } catch (error) {
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

  return (
    <div className='note'>
      <div className='list'>
        {eventTasks.map((task, index) => (
          <div className='item' key={task.id || `${eventId}-${index}`}>
            <input 
              type="checkbox" 
              checked={task.done} 
              onChange={() => handleToggleNote(index, task.done)}
              disabled={togglingNoteIndex === index}
            />
            <p 
              className={task.done ? 'done' : ''}
              onClick={() => handleToggleNote(index, task.done)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleNote(index, task.done) }}
            >{task.text}</p>
            <button 
              className='note-delete' 
              onClick={() => handleDeleteNote(index)}
              disabled={deletingNoteIndex === index}
            >
              {deletingNoteIndex === index ? 
                <Loader size={16} className="animate-spin" /> : 
                <Trash2 size={16} />
              }
            </button>
          </div>
        ))}
        
        {isAdding && (
          <div className='note-add-form'>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Nouvelle note..."
              className="note-input"
              disabled={isAddingNote}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button 
              className="note-add-btn" 
              onClick={handleAddNote}
              disabled={isAddingNote}
            >
              {isAddingNote ? 
                <Loader size={18} className="animate-spin" /> : 
                <Plus size={18} />
              }
            </button>
          </div>
        )}
      </div>
      
      <div className='footer'>
        <div 
          className='from clickable' 
          onClick={() => onOpenEventDetails && onOpenEventDetails(eventId)}
        >
          {title}
        </div>
        <div 
          className='add' 
          onClick={() => !isAddingNote && setIsAdding(!isAdding)}
        >
          <NotebookPen size={20}/>
        </div>
      </div>
    </div>
  )
}

export default Note;
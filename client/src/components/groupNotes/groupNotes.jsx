import './groupNotes.css'
import Note from '../note/note'
import { useState } from 'react'
import { PanelBottomClose, PanelLeftOpen } from 'lucide-react'

function GroupNotes({ data, onOpenEventDetails }) {
  const [open, setOpen] = useState(true);

  return (
    <div className='groupNotes'>
      <div className="groupNotes-header" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
        <h1>{data.title}</h1>
        <div className="toggle-btn" onClick={() => setOpen(o => !o)}>
          {open ? <PanelBottomClose /> : <PanelLeftOpen />}
        </div>
      </div>
      <div className="groupNotes-content">
        {open && data.notes.map((note) => (
          <Note 
            key={note.eventId} 
            eventId={note.eventId}
            title={note.name}
            tasks={note.tasks}
            onOpenEventDetails={onOpenEventDetails}
          />
        ))}
      </div>
    </div>
  )
}

// Optimisation pour éviter les re-renders inutiles
export default GroupNotes;
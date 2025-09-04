import './calendar.css'
import WeekCalendar from '../../components/weekCalendar/weekCalendar'
import Notes from '../../components/notes/notes'
import ColorPicker from '../../components/colorPicker/colorPicker'
import { Settings } from 'lucide-react'
import { useState } from 'react'
import SettingsModal from '../../components/settingsModal'
import useAuthStore from '../../utils/authStore'

const Calendar = () => {
    const [showSettings, setShowSettings] = useState(false)
    const { currentUser } = useAuthStore()

    const handleSettingsClick = () => {
        setShowSettings(true)
    }

    const handleCloseSettings = () => {
        setShowSettings(false)
    }

    return (
        <div className='content'>
            {/* Bouton paramètres positionné en absolu */}
            <button
                className='settings-button'
                onClick={handleSettingsClick}
                title="Paramètres"
            >
                <Settings size={20} />
            </button>

            <div className='calendar-dashboard'>
                {/* Header avec titre */}
                <div className='dashboard-header'>
                    <div className='dashboard-title'>
                        <h1>Emploi du temps</h1>
                        <p>Bonjour {currentUser?.username}, consultez votre planning</p>
                    </div>
                </div>

                <div className='calendar'>
                    <WeekCalendar />
                    <Notes />
                </div>
            </div>

            {showSettings && (
                <SettingsModal
                    isOpen={showSettings}
                    onClose={handleCloseSettings}
                />
            )}
        </div>
    )
}

export default Calendar

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import './home.css';
import useAuthStore from '../../utils/authStore';
import useCalendarStore from '../../utils/calendarStore';

// Import des composants du dashboard
import DailyCoursesList from '../../components/dashboard/dailyCoursesList';
import DailySchedule from '../../components/dashboard/dailySchedule';
import DailyNotesList from '../../components/dashboard/dailyNotesList';
import SettingsModal from '../../components/settingsModal';
import EventDetails from '../../components/eventDetails/eventDetails';
import UtCoursesWidget from '../../components/dashboard/utCoursesWidget';
import MailWidget from '../../components/dashboard/mailWidget';

const Home = () => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showEventDetails, setShowEventDetails] = useState(false);
    const [, setUpdateKey] = useState(0);

    const { currentUser } = useAuthStore();
    const { currentEvents, fetchEvents } = useCalendarStore();

    useEffect(() => {
        // Charger les événements au montage du composant
        fetchEvents();
    }, [fetchEvents]);

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setShowEventDetails(true);
    };

    const handleCloseEventDetails = () => {
        setShowEventDetails(false);
        setSelectedEvent(null);
    };

    // Fonction pour mettre à jour l'événement sélectionné après modification
    const handleEventUpdate = async () => {
        if (selectedEvent) {
            await fetchEvents();
            // Mettre à jour l'événement sélectionné avec la version fraîche du store
            const updatedEvents = useCalendarStore.getState().currentEvents || [];
            const updated = updatedEvents.find(e => e._id === selectedEvent._id);
            if (updated) setSelectedEvent(updated);
            // Conserver le re-render forcé existant
            setUpdateKey(prev => prev + 1);
        }
    };

    const handleSettingsClick = () => {
        setShowSettings(true);
    };

    const handleCloseSettings = () => {
        setShowSettings(false);
    };

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

            <div className='home-dashboard'>
                {/* Header avec titre */}
                <div className='dashboard-header'>
                    <div className='dashboard-title'>
                        <h1>Bonjour {currentUser.username}</h1>
                        <p>Voici votre tableau de bord pour aujourd'hui</p>
                    </div>
                </div>

                {/* Grille des modules */}
                <div className='dashboard-grid'>
                    {/* Module 1: Liste jolie des cours */}
                    <div className='dashboard-module module-1'>
                        <DailyCoursesList onEventClick={handleEventClick} />
                    </div>

                    {/* Module 2: Emploi du temps */}
                    <div className='dashboard-module module-2'>
                        <DailySchedule onEventClick={handleEventClick} />
                    </div>

                    {/* Module 3: Liste des notes du jour */}
                    <div className='dashboard-module module-3'>
                        <DailyNotesList />
                    </div>

                    {/* Module 4: Cours UniversiTice visibles */}
                    <div className='dashboard-module module-4'>
                        <UtCoursesWidget />
                    </div>

                    {/* Module 5: Mails récents */}
                    <div className='dashboard-module module-5'>
                        <MailWidget />
                    </div>
                </div>

                {/* Modals */}
                {showSettings && (
                    <SettingsModal
                        isOpen={showSettings}
                        onClose={handleCloseSettings}
                    />
                )}

                {showEventDetails && selectedEvent && (
                    <EventDetails
                        key={`event-${selectedEvent._id}`}
                        event={selectedEvent}
                        onClose={handleCloseEventDetails}
                        onEventUpdate={handleEventUpdate}
                        displayMode="modal"
                    />
                )}
            </div>
        </div>
    );
};

export default Home;
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Link, Settings, X } from 'lucide-react';
import './settingCalendar.css'
import apiRequest from '../../utils/apiRequest';
import useNotificationStore from '../../utils/notificationStore';
import useColorSettingsStore from '../../utils/colorSettingsStore';
import ColorModeSelector from '../colorModeSelector/colorModeSelector';
import CancelledEventsToggle from '../cancelledEventsToggle/cancelledEventsToggle';
import HiddenEventsManager from '../hiddenEventsManager/hiddenEventsManager';

function SettingCalendar({ onClose }) {
    const [urls, setUrls] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const notify = useNotificationStore.getState().notify;
    const [showHiddenEventsManager, setShowHiddenEventsManager] = useState(false);
    
    const { 
        colorSettings, 
        isLoading: colorLoading, 
        error: colorError, 
        loadColorSettings, 
        setColorMode,
        setShowCancelledEvents,
        clearError 
    } = useColorSettingsStore();

    const [localColorSettings, setLocalColorSettings] = useState(colorSettings);
    const [isSaving, setIsSaving] = useState(false);
    
    // Empêcher la propagation du clic
    const stopPropagation = (e) => {
        e.stopPropagation();
    };

    useEffect(() => {
        const fetchUrls = async () => {
            try {
                const res = await apiRequest.get("user/calendar");
                setUrls(res.data.icalURL || []);
            } catch (err) {
                notify({
                    type: "error",
                    title: "Erreur",
                    message: "Impossible de récupérer les calendriers",
                    duration: 5000
                });
                console.log(err);
            }
        };
        
    fetchUrls();
    loadColorSettings();
    // déclenche l'animation d'ouverture
    setTimeout(() => setIsOpen(true), 0);
    }, [notify, loadColorSettings]);

    useEffect(() => {
        setLocalColorSettings(colorSettings);
    }, [colorSettings]);

    const handleSup = async (url) => {
        try {
            await apiRequest.delete("user/calendar", { data: { calendarUrl: url } });
            setUrls(urls.filter(u => u !== url));
        } catch (err) {
            notify({
                type: "error",
                title: "Erreur",
                message: "Impossible de supprimer le calendrier",
                duration: 5000
            });
            console.log(err);
        }
    };

    const handleModeChange = async (newMode) => {
        setIsSaving(true);
        try {
            await setColorMode(newMode);
            setLocalColorSettings(prev => ({ ...prev, mode: newMode }));
        } catch (error) {
            notify({
                type: "error",
                title: "Erreur",
                message: "Impossible de sauvegarder les paramètres",
                duration: 5000
            });
            console.error('Erreur lors du changement de mode:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleCancelledEvents = async (showCancelledEvents) => {
        setIsSaving(true);
        try {
            await setShowCancelledEvents(showCancelledEvents);
            setLocalColorSettings(prev => ({ ...prev, showCancelledEvents }));
        } catch (error) {
            notify({
                type: "error",
                title: "Erreur",
                message: "Impossible de sauvegarder les paramètres",
                duration: 5000
            });
            console.error('Erreur lors du changement d\'affichage:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const requestClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        // attendre la fin de l'animation
        setTimeout(() => {
            onClose && onClose();
        }, 220);
    };

    return createPortal(
        <div className={`settingCalendar ${isOpen ? 'open' : ''} ${isClosing ? 'closing' : ''}`} onClick={requestClose}>
            <div className='settingCalendar-content' onClick={stopPropagation}>
                <button className="settingCalendar-close" onClick={requestClose}>
                    <X size={20} />
                </button>
                <h2>Paramètres</h2>
                
                {/* Section Mode de coloration */}
                <div className="settings-section">
                    <ColorModeSelector
                        currentMode={localColorSettings.mode}
                        onModeChange={handleModeChange}
                        isLoading={isSaving}
                    />
                </div>

                {/* Section Cours annulés */}
                <div className="settings-section">
                    <CancelledEventsToggle
                        showCancelledEvents={localColorSettings.showCancelledEvents}
                        onToggle={handleToggleCancelledEvents}
                        isLoading={isSaving}
                    />
                </div>

                {/* Section Événements masqués */}
                <div className="settings-section">
                    <button
                        className="setting-button"
                        onClick={() => setShowHiddenEventsManager(true)}
                    >
                        <Settings size={18} />
                        <span>Gérer les événements masqués</span>
                    </button>
                </div>

                {/* Section Calendriers existante */}
                <h3>
                    <Settings size={18} />
                    <span>Calendriers associés</span>
                </h3>
                <div className='settingCalendar-form-list'>
                    {urls.length === 0 ? (
                        <p className="empty-notes">Aucun emploi du temps ajouté.</p>
                    ) : (
                        urls.map((url, idx) => (
                            <form className='settingCalendar-form' key={idx}>
                                <div className='settingCalendar-form-input'>
                                    <span className='settingCalendar-form-input-content'>
                                        <Link size={18} />
                                        <p>{url}</p>
                                    </span>
                                    <button type="button" onClick={() => handleSup(url)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </form>
                        ))
                    )}
                </div>
            </div>

            {/* Gestionnaire d'événements masqués */}
            {showHiddenEventsManager && (
                <HiddenEventsManager
                    onClose={() => setShowHiddenEventsManager(false)}
                />
            )}
        </div>,
        document.body
    )
}

export default SettingCalendar;
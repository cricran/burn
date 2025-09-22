import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, User, Moon, Sun, Monitor, Info } from 'lucide-react';
import './settingsModal.css';
import useAuthStore from '../utils/authStore';
import useColorSettingsStore from '../utils/colorSettingsStore';
import { openLayer, discard, closeTop } from '../utils/uiHistory';
import apiRequest from '../utils/apiRequest';
import ReleaseNotes from './general/ReleaseNotes';

function SettingsModal({ isOpen, onClose }) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { currentUser, clearCurrentUser } = useAuthStore();
    const { colorSettings, toggleTheme, loadColorSettings } = useColorSettingsStore();
    const navigate = useNavigate();

    // Load color settings when modal opens and user is logged in
    useEffect(() => {
        if (isOpen && currentUser) {
            loadColorSettings();
        }
    }, [isOpen, currentUser, loadColorSettings]);

    // Register UI history so back button closes the modal first
    useEffect(() => {
        if (!isOpen) return;
        const token = openLayer(() => {
            onClose?.();
        });
        return () => discard(token);
        // Intentionally ignore onClose to avoid multiple pushState when its identity changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // Demander au serveur d'invalider le cookie JWT
            try { await apiRequest.post('/user/auth/logout'); } catch (_) { /* ignore */ }
            // Effacer l'état client
            clearCurrentUser();
            // Rediriger proprement vers la page d'auth (évite les races avec history.back)
            navigate('/auth', { replace: true });
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const stopPropagation = (e) => {
        e.stopPropagation();
    };

    const requestClose = () => {
        // Go through history so back stack stays in sync
        closeTop();
    };

    if (!isOpen) return null;

    return (
    <div className="settings-overlay" onClick={requestClose}>
            <div className="settings-modal" onClick={stopPropagation}>
                <div className="settings-header">
                    <div className="settings-title">
                        <Settings size={20} />
                        <h3>Paramètres</h3>
                    </div>
            <button className="close-button" onClick={requestClose}>
                        ×
                    </button>
                </div>

                <div className="settings-content">
                    {/* Informations utilisateur */}
                    <div className="settings-section">
                        <div className="section-header">
                            <User size={16} />
                            <h4>Utilisateur</h4>
                        </div>
                        <div className="user-info">
                            <div className="user-name">{currentUser?.username}</div>
                            <div className="user-email">{currentUser?.email}</div>
                        </div>
                    </div>

                    {/* Thème */}
                    <div className="settings-section">
                        <div className="section-header">
                            {colorSettings.theme === 'dark' ? <Moon size={16} /> : colorSettings.theme === 'light' ? <Sun size={16} /> : <Monitor size={16} />}
                            <h4>Thème</h4>
                        </div>
                        <div className="theme-toggle">
                            <button
                                className={`theme-button ${colorSettings.theme === 'light' ? 'active' : ''}`}
                                onClick={() => toggleTheme('light')}
                            >
                                <Sun size={16} />
                                Clair
                            </button>
                            <button
                                className={`theme-button ${colorSettings.theme === 'dark' ? 'active' : ''}`}
                                onClick={() => toggleTheme('dark')}
                            >
                                <Moon size={16} />
                                Sombre
                            </button>
                            <button
                                className={`theme-button ${colorSettings.theme === 'auto' ? 'active' : ''}`}
                                onClick={() => toggleTheme('auto')}
                            >
                                <Monitor size={16} />
                                Automatique
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="settings-section">
                        <div className="section-header">
                            <LogOut size={16} />
                            <h4>Actions</h4>
                        </div>
                        <button
                            className="logout-button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? (
                                <>
                                    <div className="spinner"></div>
                                    Déconnexion...
                                </>
                            ) : (
                                <>
                                    <LogOut size={16} />
                                    Se déconnecter
                                </>
                            )}
                        </button>
                    </div>

                    {/* Général (dernier bloc) */}
                    <div className="settings-section">
                        <div className="section-header">
                            <Info size={16} />
                            <h4>Général</h4>
                        </div>
                        <div className="general-info">
                            <ReleaseNotes />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsModal;

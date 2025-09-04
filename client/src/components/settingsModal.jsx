import { useState, useEffect } from 'react';
import { Settings, LogOut, User, Moon, Sun, Monitor } from 'lucide-react';
import './settingsModal.css';
import useAuthStore from '../utils/authStore';
import useColorSettingsStore from '../utils/colorSettingsStore';

function SettingsModal({ isOpen, onClose }) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { currentUser, clearCurrentUser } = useAuthStore();
    const { colorSettings, toggleTheme, loadColorSettings } = useColorSettingsStore();

    // Load color settings when modal opens and user is logged in
    useEffect(() => {
        if (isOpen && currentUser) {
            loadColorSettings();
        }
    }, [isOpen, currentUser, loadColorSettings]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // Attendre un peu pour l'effet visuel
            await new Promise(resolve => setTimeout(resolve, 500));
            clearCurrentUser();
            onClose();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const stopPropagation = (e) => {
        e.stopPropagation();
    };

    if (!isOpen) return null;

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={stopPropagation}>
                <div className="settings-header">
                    <div className="settings-title">
                        <Settings size={20} />
                        <h3>Paramètres</h3>
                    </div>
                    <button className="close-button" onClick={onClose}>
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
                </div>
            </div>
        </div>
    );
}

export default SettingsModal;

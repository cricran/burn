import { Palette } from 'lucide-react';
import './colorModeSelector.css';

const ColorModeSelector = ({ currentMode, onModeChange, isLoading }) => {
    const handleModeSelect = (mode) => {
        onModeChange(mode);
    };

    return (
        <div className="color-mode-selector">
            <h3>
                <Palette size={18} />
                <span>Mode de coloration</span>
            </h3>
            
            <div className="mode-selector-container">
                <button
                    className={`mode-button ${currentMode === 'type' ? 'active' : ''} left`}
                    onClick={() => handleModeSelect('type')}
                    disabled={isLoading}
                >
                    Une couleur par type
                </button>
                <button
                    className={`mode-button ${currentMode === 'individual' ? 'active' : ''} right`}
                    onClick={() => handleModeSelect('individual')}
                    disabled={isLoading}
                >
                    Couleur individuelle
                </button>
            </div>
            
            {currentMode === 'type' && (
                <div className="mode-description">
                    <p>Chaque type de cours (CM, TD, TP, CC) aura sa propre couleur fixe.</p>
                </div>
            )}
            
            {currentMode === 'individual' && (
                <div className="mode-description">
                    <p>Chaque cours aura une couleur unique basée sur son nom.</p>
                </div>
            )}
        </div>
    );
};

export default ColorModeSelector;
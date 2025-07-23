import { EyeOff, Eye } from 'lucide-react';
import './cancelledEventsToggle.css';

const CancelledEventsToggle = ({ showCancelledEvents, onToggle, isLoading }) => {
    return (
        <div className="cancelled-events-toggle">
            <h3>
                {showCancelledEvents ? <Eye size={18} /> : <EyeOff size={18} />}
                <span>Cours annulés</span>
            </h3>
            
            <div className="toggle-container">
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={showCancelledEvents}
                        onChange={(e) => onToggle(e.target.checked)}
                        disabled={isLoading}
                    />
                    <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">
                    {showCancelledEvents ? 'Affichés' : 'Masqués'}
                </span>
            </div>
            
            <div className="toggle-description">
                <p>
                    {showCancelledEvents 
                        ? 'Les cours annulés sont affichés en gris hachuré.' 
                        : 'Les cours annulés sont masqués de l\'emploi du temps.'
                    }
                </p>
            </div>
        </div>
    );
};

export default CancelledEventsToggle;
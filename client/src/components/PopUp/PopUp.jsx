import './PopUp.css';
import { useEffect } from 'react';
import { openLayer, discard, closeTop } from '../../utils/uiHistory';

const PopUp = ({ title, text, onClose }) => {
    useEffect(() => {
        const token = openLayer(() => onClose?.());
        return () => discard(token);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const requestCloseViaHistory = () => closeTop();

    return (
        <div className="popup-overlay" onClick={requestCloseViaHistory}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <button className="popup-close" onClick={requestCloseViaHistory}>×</button>
                <h2>{title}</h2>
                <div className="popup-text">{text}</div>
            </div>
        </div>
    );
};

export default PopUp;
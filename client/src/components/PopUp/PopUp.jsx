import './PopUp.css';

const PopUp = ({ title, text, onClose }) => {
    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <button className="popup-close" onClick={onClose}>×</button>
                <h2>{title}</h2>
                <div className="popup-text">{text}</div>
            </div>
        </div>
    );
};

export default PopUp;
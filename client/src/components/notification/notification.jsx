import { Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import useNotificationStore from '../../utils/notificationStore';
import './notification.css';

const icons = {
    info: <Info color="#2b90ff" size={22} />,
    warning: <AlertTriangle color="#f90" size={22} />,
    error: <XCircle color="#ff3b3b" size={22} />
};

const colors = {
    info: "#2b90ff",
    warning: "#f90",
    error: "#ff3b3b"
};

function Notification({ id, type = "info", title, message = "", duration = 5000 }) {
    const remove = useNotificationStore(state => state.remove);
    const [progress, setProgress] = useState(100);
    const [hover, setHover] = useState(false);
    const timerRef = useRef();
    const startTimeRef = useRef(Date.now());
    const [remaining, setRemaining] = useState(duration);

    useEffect(() => {
        if (hover) {
            clearInterval(timerRef.current);
            setRemaining(duration * (progress / 100));
            return;
        }
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const percent = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(percent);
            if (percent <= 0) {
                clearInterval(timerRef.current);
                remove(id);
            }
        }, 30);
        return () => clearInterval(timerRef.current);
    }, [hover, duration, remove, id, progress]);

    return (
        <div
            className="notification"
            style={{
                borderLeft: `5px solid ${colors[type]}`,
                boxShadow: "0 2px 12px #0002"
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => {
                startTimeRef.current = Date.now() - (duration * (1 - progress / 100));
                setHover(false);
            }}
        >
            <div className="notification-content">
                <span className="notification-icon">{icons[type]}</span>
                <div className="notification-text">
                    <div className="notification-title">{title}</div>
                    {message && <div className="notification-message">{message}</div>}
                </div>
                <button className="notification-close" onClick={() => remove(id)}>
                    <X size={18} />
                </button>
            </div>
            <div
                className="notification-progress"
                style={{
                    width: `${progress}%`,
                    background: colors[type]
                }}
            />
        </div>
    );
}

export default Notification;
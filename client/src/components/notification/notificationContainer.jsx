import useNotificationStore from '../../utils/notificationStore';
import Notification from './notification';
import './notification.css';

const NotificationContainer = () => {
    const notifications = useNotificationStore(state => state.notifications);

    return (
        <div className="notification-container">
            {notifications.map(n => (
                <Notification key={n.id} {...n} />
            ))}
        </div>
    );
};

export default NotificationContainer;
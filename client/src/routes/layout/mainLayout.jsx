import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from 'react';
import useAuthStore from "../../utils/authStore";
import './mainLayout.css'
import NavBar from '../../components/navBar/navBar'
import NotificationContainer from '../../components/notification/notificationContainer';
import apiRequest from '../../utils/apiRequest';

const MainLayout = () => {
    const { currentUser, setCurrentUser } = useAuthStore();
    const [checking, setChecking] = useState(true);
    const triedRef = useRef(false);

    // Always attempt to recover session on first mount if user is missing
    useEffect(() => {
        const tryRecover = async () => {
            if (triedRef.current) return;
            triedRef.current = true;
            if (currentUser) {
                setChecking(false);
                return;
            }
            try {
                const res = await apiRequest.get('/user/me');
                if (res?.data) setCurrentUser(res.data);
            } catch (_) {
                // ignore; will fall through to redirect
            } finally {
                setChecking(false);
            }
        };
        tryRecover();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (checking) return null;

    if (!currentUser) {
        // Not authenticated, redirect to login
        return <Navigate to="/auth" replace />;
    }

    // Authenticated, show the layout and nested routes
    return (
        <div>
            <div className='shadow'>
                {/* <div className='img'></div> */}
            </div>
            <NavBar />
            <NotificationContainer />
            <Outlet />
        </div>
    )
}

export default MainLayout;
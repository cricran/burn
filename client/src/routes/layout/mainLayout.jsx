import { Outlet, Navigate } from "react-router-dom";
import useAuthStore from "../../utils/authStore";
import './mainLayout.css'
import NavBar from '../../components/navBar/navBar'
import NotificationContainer from '../../components/notification/notificationContainer';

const MainLayout = () => {
    const { currentUser } = useAuthStore();

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
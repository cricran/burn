/**
 * Session Manager - Centralized session cleanup for user logout
 * 
 * This module ensures complete isolation between user sessions by clearing
 * all stores when a user logs out, preventing data leaks between users.
 */

import useAuthStore from './authStore';
import useCalendarStore from './calendarStore';
import useColorSettingsStore from './colorSettingsStore';
import useHiddenEventsStore from './hiddenEventsStore';
import useHiddenCoursesStore from './hiddenCoursesStore';
import useMailSettingsStore from './mailSettingsStore';
import useNotificationStore from './notificationStore';

/**
 * Clears all user-specific stores to ensure complete session isolation.
 * This function should be called when a user logs out to prevent data
 * from leaking to the next user who logs in on the same browser.
 */
export const clearAllStores = () => {
    try {
        // Reset all stores to their initial state
        useAuthStore.getState().reset();
        useCalendarStore.getState().reset();
        useColorSettingsStore.getState().reset();
        useHiddenEventsStore.getState().reset();
        useHiddenCoursesStore.getState().reset();
        useMailSettingsStore.getState().reset();
        useNotificationStore.getState().reset();
        
        // Clear localStorage for persisted stores
        try {
            localStorage.removeItem('auth-storage');
            localStorage.removeItem('color-settings-storage');
            localStorage.removeItem('mail-settings-storage');
        } catch (e) {
            console.error('Failed to clear localStorage:', e);
        }
        
        console.log('All stores cleared for session isolation');
    } catch (error) {
        console.error('Error clearing stores:', error);
    }
};

/**
 * Initializes a new user session by loading user-specific data.
 * This should be called after a successful login.
 */
export const initializeSession = async (user) => {
    try {
        // The stores will automatically load their data when needed
        // through their respective load functions
        console.log('Session initialized for user:', user?.username);
    } catch (error) {
        console.error('Error initializing session:', error);
    }
};

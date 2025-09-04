import {create} from 'zustand';
import { persist } from 'zustand/middleware';
import useColorSettingsStore from './colorSettingsStore';

const useAuthStore = create(
    persist((set, get) => ({
        currentUser: null,
        setCurrentUser: (newUser) => {
            set({ currentUser: newUser });
            // Load color settings when user logs in
            if (newUser) {
                const colorStore = useColorSettingsStore.getState();
                colorStore.loadColorSettings().catch(console.error);
            }
        },
        clearCurrentUser: () => set({ currentUser: null }),
        updateCurrentUser : (newUser) => set({currentUser: newUser}),
    }))
);

export default useAuthStore;
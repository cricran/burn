import {create} from 'zustand';
import { persist } from 'zustand/middleware';
import useColorSettingsStore from './colorSettingsStore';

const useAuthStore = create(
    persist(
        (set, get) => ({
            // Persisted state
            currentUser: null,

            // Hydration flag (not persisted explicitly, but will be set post-rehydration)
            hydrated: false,

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
            
            // Reset store to initial state
            reset: () => set({ currentUser: null, hydrated: false }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ currentUser: state.currentUser }),
            onRehydrateStorage: () => (state) => {
                // Mark store as hydrated after rehydration
                if (state) {
                    state.hydrated = true;
                }
            },
        }
    )
);

export default useAuthStore;
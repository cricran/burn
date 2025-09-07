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
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ currentUser: state.currentUser }),
            onRehydrateStorage: () => (state, error) => {
                // Mark store as hydrated after we finish rehydration
                try { set({ hydrated: true }); } catch { /* noop */ }
            },
        }
    )
);

export default useAuthStore;
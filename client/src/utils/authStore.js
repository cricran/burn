import {create} from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist((set) => ({
        currentUser: null,
        setCurrentUser: (newUser) => set({ currentUser: newUser }),
        clearCurrentUser: () => set({ currentUser: null }),
        updateCurrentUser : (newUser) => set({currentUser: newUser}),
    }))
);

export default useAuthStore;
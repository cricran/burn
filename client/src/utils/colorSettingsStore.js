import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiRequest from './apiRequest';

const useColorSettingsStore = create(
    persist(
        (set, get) => ({
            // État initial
            colorSettings: {
                mode: 'type',
                customColors: {},
                showCancelledEvents: true,
                theme: 'dark' // Add theme support
            },
            isLoading: false,
            error: null,

    // Charger les paramètres depuis le backend
    loadColorSettings: async () => {
        set({ isLoading: true, error: null });
        
        try {
            const response = await apiRequest.get('/color-settings');
            set({ 
                colorSettings: response.data,
                isLoading: false 
            });
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Erreur lors du chargement',
                isLoading: false 
            });
        }
    },

    // Mettre à jour les paramètres
    updateColorSettings: async (newSettings) => {
        set({ isLoading: true, error: null });
        
        try {
            const response = await apiRequest.put('/color-settings', newSettings);
            set({ 
                colorSettings: response.data,
                isLoading: false 
            });
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Erreur lors de la sauvegarde',
                isLoading: false 
            });
        }
    },

    // Changer le mode de couleur
    setColorMode: async (mode) => {
        const currentSettings = get().colorSettings;
        await get().updateColorSettings({
            ...currentSettings,
            mode
        });
    },

    // Définir si les événements annulés doivent être affichés
    setShowCancelledEvents: async (showCancelledEvents) => {
        const currentSettings = get().colorSettings;
        await get().updateColorSettings({
            ...currentSettings,
            showCancelledEvents
        });
    },

    // Définir une couleur personnalisée pour un cours
    setCustomColor: async (courseTitle, color) => {
        const currentSettings = get().colorSettings;
        const updatedCustomColors = {
            ...currentSettings.customColors,
            [courseTitle]: color
        };
        
        await get().updateColorSettings({
            ...currentSettings,
            customColors: updatedCustomColors
        });
    },

    // Clear error
    clearError: () => set({ error: null }),

    // Toggle theme
    toggleTheme: (theme) => {
        set((state) => ({
            colorSettings: {
                ...state.colorSettings,
                theme
            }
        }));
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
    }
        }),
        {
            name: 'color-settings-storage' // unique name for localStorage
        }
    )
);

export default useColorSettingsStore;
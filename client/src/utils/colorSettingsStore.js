import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiRequest from './apiRequest';

// Helper function to get system theme preference
const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

const useColorSettingsStore = create(
    persist(
        (set, get) => ({
            // État initial
            colorSettings: {
                mode: 'type',
                customColors: {},
                showCancelledEvents: true,
                theme: 'auto' // Changed default to 'auto'
            },
            isLoading: false,
            error: null,
            systemThemeListener: null, // Store reference to the listener

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
    toggleTheme: async (theme) => {
        // Update local state immediately for responsive UI
        set((state) => ({
            colorSettings: {
                ...state.colorSettings,
                theme
            }
        }));
        
        // Apply theme to document
        const actualTheme = theme === 'auto' ? getSystemTheme() : theme;
        document.documentElement.setAttribute('data-theme', actualTheme);
        
        // Manage system theme listener
        const currentState = get();
        if (currentState.systemThemeListener) {
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', currentState.systemThemeListener);
        }
        
        if (theme === 'auto') {
            const listener = (e) => {
                const newSystemTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newSystemTheme);
            };
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
            set({ systemThemeListener: listener });
        } else {
            set({ systemThemeListener: null });
        }
        
        // Save to backend
        try {
            await get().updateColorSettings({ theme });
        } catch (error) {
            // If backend update fails, revert local state
            set((state) => ({
                colorSettings: {
                    ...state.colorSettings,
                    theme: state.colorSettings.theme // keep current theme
                },
                error: error.response?.data?.message || 'Erreur lors de la sauvegarde du thème'
            }));
        }
    },

    // Get the actual theme to apply (resolves 'auto' to 'light' or 'dark')
    getActualTheme: () => {
        const { colorSettings } = get();
        return colorSettings.theme === 'auto' ? getSystemTheme() : colorSettings.theme;
    }
        }),
        {
            name: 'color-settings-storage', // unique name for localStorage
            onRehydrateStorage: () => (state) => {
                // Set up system theme listener if theme is auto after rehydration
                if (state?.colorSettings?.theme === 'auto') {
                    const listener = (e) => {
                        const newSystemTheme = e.matches ? 'dark' : 'light';
                        document.documentElement.setAttribute('data-theme', newSystemTheme);
                    };
                    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
                    state.systemThemeListener = listener;
                }
                // Apply current theme
                const actualTheme = state?.colorSettings?.theme === 'auto' ? getSystemTheme() : state?.colorSettings?.theme;
                if (actualTheme) {
                    document.documentElement.setAttribute('data-theme', actualTheme);
                }
            }
        }
    )
);

export default useColorSettingsStore;
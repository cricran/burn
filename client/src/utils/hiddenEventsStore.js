import { create } from 'zustand';
import apiRequest from './apiRequest';
import useCalendarStore from './calendarStore';

const useHiddenEventsStore = create((set, get) => ({
    // État initial
    hiddenEvents: {
        individual: [],
        byName: []
    },
    isLoading: false,
    error: null,

    // Charger les paramètres depuis le backend
    loadHiddenEvents: async () => {
        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest.get('/hidden-events');
            set({
                hiddenEvents: response.data,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Erreur lors du chargement',
                isLoading: false
            });
        }
    },

    // Masquer un événement individuel
    hideIndividualEvent: async (eventId) => {
        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest.post('/hidden-events/hide-individual', { eventId });
            set({
                hiddenEvents: response.data.hiddenEvents,
                isLoading: false
            });
            // Invalider le cache du calendrier et recharger les événements
            useCalendarStore.getState().invalidateCache();
            return { success: true };
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Erreur lors du masquage',
                isLoading: false
            });
            return { success: false, error };
        }
    },

    // Masquer tous les événements d'un nom
    hideEventsByName: async (eventName) => {
        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest.post('/hidden-events/hide-by-name', { eventName });
            set({
                hiddenEvents: response.data.hiddenEvents,
                isLoading: false
            });
            // Invalider le cache du calendrier et recharger les événements
            useCalendarStore.getState().invalidateCache();
            return { success: true };
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Erreur lors du masquage',
                isLoading: false
            });
            return { success: false, error };
        }
    },

    // Afficher un événement individuel
    showIndividualEvent: async (eventId) => {
        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest.post('/hidden-events/show-individual', { eventId });
            set({
                hiddenEvents: response.data.hiddenEvents,
                isLoading: false
            });
            // Invalider le cache du calendrier et recharger les événements
            useCalendarStore.getState().invalidateCache();
            return { success: true };
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Erreur lors de l\'affichage',
                isLoading: false
            });
            return { success: false, error };
        }
    },

    // Afficher tous les événements d'un nom
    showEventsByName: async (eventName) => {
        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest.post('/hidden-events/show-by-name', { eventName });
            set({
                hiddenEvents: response.data.hiddenEvents,
                isLoading: false
            });
            // Invalider le cache du calendrier et recharger les événements
            useCalendarStore.getState().invalidateCache();
            return { success: true };
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Erreur lors de l\'affichage',
                isLoading: false
            });
            return { success: false, error };
        }
    },

    // Récupérer tous les événements sans filtrage pour le gestionnaire
    fetchAllEventsForManager: async (start, end) => {
        try {
            const response = await apiRequest.get('/calendar', {
                params: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                    includeHidden: true
                }
            });
            return response.data.events;
        } catch (error) {
            console.error('Erreur lors de la récupération des événements:', error);
            return [];
        }
    },

    // Clear error
    clearError: () => set({ error: null })
}));

export default useHiddenEventsStore;

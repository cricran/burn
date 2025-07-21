import { create } from 'zustand';
import { addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import apiRequest from './apiRequest';

const useCalendarStore = create((set, get) => ({
  // État
  events: {},  // Cache des événements par période {startDate-endDate: [events]}
  currentEvents: [], // Événements actuellement affichés
  lastFetch: {}, // Date de dernière récupération par période {startDate-endDate: timestamp}
  isLoading: false,
  error: null,
  currentDate: new Date(),
  
  // Getters
  getCurrentWeekKey: () => {
    const currentDate = get().currentDate;
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `${start.toISOString()}-${end.toISOString()}`;
  },

  // Actions
  setCurrentDate: (date) => set({ currentDate: date }),
  
  fetchEvents: async (force = false) => {
    const { currentDate, events, lastFetch, getCurrentWeekKey } = get();
    
    // Calculer les bornes de la semaine
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    const weekKey = getCurrentWeekKey();
    
    // Vérifier si les données sont déjà en cache et pas trop anciennes (30 min)
    const cachedEvents = events[weekKey];
    const lastFetchTime = lastFetch[weekKey] || 0;
    const isCacheFresh = (Date.now() - lastFetchTime) < 30 * 60 * 1000;
    
    // Si les données sont en cache et récentes, les utiliser
    if (!force && cachedEvents && isCacheFresh) {
      set({ currentEvents: cachedEvents });
      return cachedEvents;
    }
    
    // Sinon, faire une requête API
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest.get(
        `/calendar?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      
      const parsed = (res.data.events || []).map(ev => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      }));
      
      // Mettre à jour le cache et les événements actuels
      set(state => ({
        events: { ...state.events, [weekKey]: parsed },
        lastFetch: { ...state.lastFetch, [weekKey]: Date.now() },
        currentEvents: parsed,
        isLoading: false
      }));
      
      return parsed;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      console.error('Error fetching events:', err);
      return [];
    }
  },
  
  // Invalidation du cache si ajout/suppression de calendrier
  invalidateCache: () => {
    set({ events: {}, lastFetch: {} });
  },
  
  // Actions pour les notes
  addNote: async (eventId, text) => {
    try {
      const res = await apiRequest.post('/note/add', { eventId, text });
      
      // Mettre à jour l'événement dans le cache et les événements actuels
      set(state => {
        // Créer de nouvelles copies pour tous les tableaux et objets
        const newEvents = { ...state.events };
        const currentEvents = [...state.currentEvents];
        
        // Mettre à jour les événements actuels
        const eventIndex = currentEvents.findIndex(e => e._id === eventId);
        if (eventIndex !== -1) {
          // Créer une nouvelle référence pour l'événement
          currentEvents[eventIndex] = {
            ...currentEvents[eventIndex],
            tasks: res.data.tasks
          };
        }
        
        // Mettre à jour le cache pour toutes les semaines
        Object.keys(newEvents).forEach(weekKey => {
          const weekEvents = [...newEvents[weekKey]];
          const weekEventIndex = weekEvents.findIndex(e => e._id === eventId);
          if (weekEventIndex !== -1) {
            weekEvents[weekEventIndex] = {
              ...weekEvents[weekEventIndex],
              tasks: res.data.tasks
            };
            newEvents[weekKey] = weekEvents;
          }
        });
        
        return { events: newEvents, currentEvents };
      });
      
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error adding note:', err);
      return { success: false, error: err };
    }
  },
  
  toggleNote: async (eventId, noteIndex, done) => {
    try {
      const res = await apiRequest.put('/note/toggle', { eventId, noteIndex, done });
      
      // Mettre à jour l'événement dans le cache et les événements actuels
      set(state => {
        // Créer de nouvelles copies pour tous les tableaux et objets
        const newEvents = { ...state.events };
        const currentEvents = [...state.currentEvents];
        
        // Mettre à jour les événements actuels
        const eventIndex = currentEvents.findIndex(e => e._id === eventId);
        if (eventIndex !== -1) {
          // Créer une nouvelle référence pour l'événement
          currentEvents[eventIndex] = {
            ...currentEvents[eventIndex],
            tasks: res.data.tasks
          };
        }
        
        // Mettre à jour le cache pour toutes les semaines
        Object.keys(newEvents).forEach(weekKey => {
          const weekEvents = [...newEvents[weekKey]];
          const weekEventIndex = weekEvents.findIndex(e => e._id === eventId);
          if (weekEventIndex !== -1) {
            weekEvents[weekEventIndex] = {
              ...weekEvents[weekEventIndex],
              tasks: res.data.tasks
            };
            newEvents[weekKey] = weekEvents;
          }
        });
        
        return { events: newEvents, currentEvents };
      });
      
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error toggling note:', err);
      return { success: false, error: err };
    }
  },
  
  deleteNote: async (eventId, noteIndex) => {
    try {
      const res = await apiRequest.delete('/note/delete', { 
        data: { eventId, noteIndex }
      });
      
      // Mettre à jour l'événement dans le cache et les événements actuels
      set(state => {
        // Créer de nouvelles copies pour tous les tableaux et objets
        const newEvents = { ...state.events };
        const currentEvents = [...state.currentEvents];
        
        // Mettre à jour les événements actuels
        const eventIndex = currentEvents.findIndex(e => e._id === eventId);
        if (eventIndex !== -1) {
          // Créer une nouvelle référence pour l'événement
          currentEvents[eventIndex] = {
            ...currentEvents[eventIndex],
            tasks: res.data.tasks
          };
        }
        
        // Mettre à jour le cache pour toutes les semaines
        Object.keys(newEvents).forEach(weekKey => {
          const weekEvents = [...newEvents[weekKey]];
          const weekEventIndex = weekEvents.findIndex(e => e._id === eventId);
          if (weekEventIndex !== -1) {
            weekEvents[weekEventIndex] = {
              ...weekEvents[weekEventIndex],
              tasks: res.data.tasks
            };
            newEvents[weekKey] = weekEvents;
          }
        });
        
        return { events: newEvents, currentEvents };
      });
      
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error deleting note:', err);
      return { success: false, error: err };
    }
  }
}));

export default useCalendarStore;
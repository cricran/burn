import { create } from 'zustand';
import { addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import apiRequest, { dedupe } from './apiRequest';

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
  // Obtenir la clé de semaine pour une date donnée sans modifier l'état courant
  getWeekKeyFor: (date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
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
      const res = await dedupe(
        `week:${start.toISOString()}-${end.toISOString()}`,
        () => apiRequest.get(`/calendar?start=${start.toISOString()}&end=${end.toISOString()}`)
      );
      
      // If backend signals a sync warning (e.g., ADE outage), let UI know via a lightweight console and optional notification
      try {
        if (res?.data?.syncWarning === 'fetch-empty' && typeof window !== 'undefined') {
          // Lazy import to avoid tight coupling
          import('./notificationStore').then(mod => {
            const notify = mod.default.getState().notify;
            notify({
              type: 'warning',
              title: "Mise à jour EDT indisponible",
              message: "Le serveur ADE ne répond pas. Affichage des cours déjà enregistrés.",
              duration: 6000
            });
          }).catch(() => {
            // no-op
          });
          // Also log for devs
          // eslint-disable-next-line no-console
          console.warn('Calendar sync warning: upstream returned no data; using cached DB events.');
        }
      } catch (_) { /* ignore */ }

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

  // Récupérer les événements pour la semaine contenant `date` sans toucher
  // à currentDate ni currentEvents. Met à jour le cache et renvoie le tableau.
  fetchEventsForDate: async (date, force = false) => {
    const { events, lastFetch } = get();

    // Calculer les bornes de la semaine pour la date passée
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const weekKey = `${start.toISOString()}-${end.toISOString()}`;

    // Vérifier le cache (30 min)
    const cachedEvents = events[weekKey];
    const lastFetchTime = lastFetch[weekKey] || 0;
    const isCacheFresh = (Date.now() - lastFetchTime) < 30 * 60 * 1000;

    if (!force && cachedEvents && isCacheFresh) {
      return cachedEvents;
    }

    // Sinon, requête API pour cette semaine spécifique
    try {
  const res = await dedupe(
        `week:${start.toISOString()}-${end.toISOString()}`,
        () => apiRequest.get(`/calendar?start=${start.toISOString()}&end=${end.toISOString()}`)
      );

      try {
        if (res?.data?.syncWarning === 'fetch-empty' && typeof window !== 'undefined') {
          import('./notificationStore').then(mod => {
            const notify = mod.default.getState().notify;
            notify({
              type: 'warning',
              title: "Mise à jour EDT indisponible",
              message: "Le serveur ADE ne répond pas. Affichage des cours déjà enregistrés.",
              duration: 6000
            });
          }).catch(() => {});
        }
      } catch (_) { /* ignore */ }

      const parsed = (res.data.events || []).map(ev => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      }));

      // Mettre à jour uniquement le cache, sans toucher currentEvents/currentDate
      set(state => ({
        events: { ...state.events, [weekKey]: parsed },
        lastFetch: { ...state.lastFetch, [weekKey]: Date.now() },
      }));

      return parsed;
    } catch (err) {
      console.error('Error fetching events for date:', err);
      return [];
    }
  },

  // Prefetch a single range (e.g., next 60 days) in one request and populate week caches
  prefetchDaysAhead: async (days = 60) => {
    const { currentDate } = get();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);

    try {
      const res = await dedupe(
        `range:${start.toISOString()}-${end.toISOString()}`,
        () => apiRequest.get(`/calendar?start=${start.toISOString()}&end=${end.toISOString()}`)
      );

      const parsed = (res.data.events || []).map(ev => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      }));

      // Group events by week key
      const byWeek = new Map();
      parsed.forEach(ev => {
        const wStart = startOfWeek(new Date(ev.start), { weekStartsOn: 1 });
        const wEnd = endOfWeek(new Date(ev.start), { weekStartsOn: 1 });
        const wk = `${wStart.toISOString()}-${wEnd.toISOString()}`;
        if (!byWeek.has(wk)) byWeek.set(wk, []);
        byWeek.get(wk).push(ev);
      });

      // Build new caches
      set(state => {
        const newEvents = { ...state.events };
        const newLastFetch = { ...state.lastFetch };

        byWeek.forEach((list, wk) => {
          // sort events inside the week for consistency
          const sorted = list.slice().sort((a,b) => new Date(a.start) - new Date(b.start));
          newEvents[wk] = sorted;
          newLastFetch[wk] = Date.now();
        });

        // Optionally update currentEvents for the current week
        const nowWStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const nowWEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        const nowKey = `${nowWStart.toISOString()}-${nowWEnd.toISOString()}`;
        const currentEvents = newEvents[nowKey] || state.currentEvents;

        return { events: newEvents, lastFetch: newLastFetch, currentEvents };
      });

      return true;
    } catch (err) {
      // do not break the UI if prefetch fails
      // eslint-disable-next-line no-console
      console.error('Error prefetching calendar range:', err);
      return false;
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
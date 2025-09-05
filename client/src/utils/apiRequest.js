import axios from "axios";
import useAuthStore from './authStore';

const apiRequest = axios.create({
    baseURL: import.meta.env.VITE_API_ENDPOINT,
    withCredentials: true,
});

// Interceptor pour rediriger vers la page de connexion en cas de 401
apiRequest.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        if (status === 401) {
            // Effacer l'utilisateur stocké
            try {
                useAuthStore.getState().clearCurrentUser();
            } catch (e) {
                // ignore
            }

            // Redirection vers /auth en conservant l'URL courante
            if (typeof window !== 'undefined') {
                const current = window.location.pathname + window.location.search + window.location.hash;
                // Eviter boucle si on est déjà sur la page d'auth
                if (!current.startsWith('/auth')) {
                    // Garde pour éviter plusieurs remplacements simultanés
                    const alreadyRedirected = sessionStorage.getItem('authRedirect');
                    if (!alreadyRedirected) {
                        sessionStorage.setItem('authRedirect', '1');
                        const redirectParam = encodeURIComponent(current);
                        // replace pour éviter que l'utilisateur remonte sur la page protégée
                        window.location.replace(`/auth?redirect=${redirectParam}`);
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default apiRequest;

// Optional: tiny client-side throttle/dedupe helpers (can be imported if needed)
export const withThrottle = (() => {
    let last = 0;
    return async (ms, fn) => {
        const now = Date.now();
        if (now - last < ms) {
            await new Promise(r => setTimeout(r, ms - (now - last)));
        }
        last = Date.now();
        return fn();
    };
})();

const inflight = new Map();
export const dedupe = async (key, factory) => {
    if (inflight.has(key)) return inflight.get(key);
    const p = factory().finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
}
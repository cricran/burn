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
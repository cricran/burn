self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
    if (event.request.url.includes('universitice.univ-rouen.fr')) {
        console.log('Intercepting Moodle request:', event.request.url);
        event.respondWith(
            fetch(event.request, {
                credentials: 'include',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).catch(error => {
                console.error('Service Worker fetch error:', error);
                throw error;
            })
        );
    }
});

self.addEventListener('error', event => {
    console.error('Service Worker error:', event.error);
});
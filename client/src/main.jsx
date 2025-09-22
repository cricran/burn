import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Auth from './routes/auth/auth'
import LandingPage from './routes/landingPage/landingPage'
import Home from './routes/home/home'
import MainLayout from './routes/layout/mainLayout'
import Calendar from './routes/calendar/calendar'
import UniversiTice from './routes/universitice/universitice'
import Mail from './routes/mail/mail'
import { setupPWAUpdate } from './utils/pwaUpdate'

const queryClient = new QueryClient();

// Load theme from localStorage or default to auto
const savedTheme = localStorage.getItem('color-settings-storage');
let initialTheme = 'auto';
if (savedTheme) {
    try {
        const parsed = JSON.parse(savedTheme);
        initialTheme = parsed.state?.colorSettings?.theme || 'auto';
    } catch (e) {
        console.warn('Failed to parse theme from localStorage');
    }
}

// Helper function to get system theme preference
const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

// Apply initial theme
const actualInitialTheme = initialTheme === 'auto' ? getSystemTheme() : initialTheme;
document.documentElement.setAttribute('data-theme', actualInitialTheme);

// Ensure stale service workers are removed and PWA updates are applied
if ('serviceWorker' in navigator) {
  // Unregister any legacy SWs that might have been registered previously
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) {
      // Keep only the vite-plugin-pwa generated sw (scope '/')
      // and unregister others (like custom moodle-auth SW if any)
      if (reg.active && reg.active.scriptURL && !/\/(sw\.js|workbox-).+/.test(reg.active.scriptURL)) {
        reg.unregister();
      }
    }
  }).catch(() => {});
}

// Proactively check for a new SW and refresh when available
setupPWAUpdate()

const root = createRoot(document.getElementById('root'))
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/auth' element={<Auth />} />

          <Route element={<MainLayout />}>
            <Route path='/my' element={<Home />} />
            <Route path='/universitice' element={<UniversiTice />} />
            <Route path='/edt' element={<Calendar />} />
            <Route path='/mail' element={<Mail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)

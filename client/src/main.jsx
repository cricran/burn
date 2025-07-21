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

const queryClient = new QueryClient();

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
            <Route path='/universiTice' element={<Auth />} />
            <Route path='/edt' element={<Calendar />} />
            <Route path='/profile' element={<LandingPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)

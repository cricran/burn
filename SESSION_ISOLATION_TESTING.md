# Session Isolation Testing Guide

## Overview
This document explains how to test the session isolation feature that ensures user data doesn't leak between different user sessions.

## What Was Changed
The application now properly clears all user-specific data when a user logs out, including:
- Authentication state (auth store)
- Calendar events cache (calendar store)
- Color settings (color settings store)
- Hidden events (hidden events store)
- Hidden courses (hidden courses store)
- Mail settings (mail settings store)
- Notifications (notification store)
- LocalStorage persisted data

## How to Test Session Isolation

### Test Case 1: Logout Clears All Data
1. **Login as User A**
   - Navigate to `/auth`
   - Login with valid credentials
   - Wait for the calendar to load
   - Change some color settings
   - Hide some events or courses

2. **Verify User A's Data**
   - Open browser DevTools (F12)
   - Go to Application tab → Local Storage
   - Verify you see `auth-storage`, `color-settings-storage`, `mail-settings-storage`
   - Go to Console tab and type: `useCalendarStore.getState().events`
   - Verify calendar events are cached

3. **Logout**
   - Click on Settings (gear icon)
   - Click "Se déconnecter" (Logout)
   - You should be redirected to `/auth`

4. **Verify Data is Cleared**
   - In DevTools Application tab → Local Storage
   - Verify all storage items are cleared
   - In Console: `useCalendarStore.getState().events`
   - Should return empty object `{}`
   - Check other stores are also reset:
     ```javascript
     useCalendarStore.getState()
     useColorSettingsStore.getState()
     useHiddenEventsStore.getState()
     ```

### Test Case 2: Multiple Users Don't Share Data
1. **Login as User A**
   - Login with credentials for User A
   - Add a calendar URL
   - View events for the week
   - Change color settings (e.g., set theme to dark)
   - Hide a specific event

2. **Remember User A's Settings**
   - Note the calendar events visible
   - Note the color theme
   - Note the hidden events

3. **Logout User A**
   - Click Settings → Logout

4. **Login as User B**
   - Login with different credentials (User B)
   - Add User B's calendar URL
   - View User B's events

5. **Verify No Data Leak**
   - User B should NOT see User A's calendar events
   - User B should NOT see User A's color settings
   - User B should NOT see User A's hidden events
   - Color theme should be back to default (auto)
   - Calendar should be empty or show User B's events only

### Test Case 3: Session Timeout (401/403)
1. **Login as User A**
   - Login and let the session load

2. **Simulate Session Timeout**
   - In DevTools Console, clear the JWT cookie:
     ```javascript
     document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
     ```

3. **Trigger API Request**
   - Navigate to calendar or refresh
   - The app should detect 401/403 error

4. **Verify Auto-Cleanup**
   - Should be automatically redirected to `/auth`
   - All stores should be cleared
   - No user data should remain in localStorage

## Expected Results
✅ After logout, all stores are reset to initial state
✅ After logout, localStorage is cleared
✅ Different users don't see each other's data
✅ Session timeout automatically clears all data
✅ No console errors during logout process

## Troubleshooting
If data persists after logout:
1. Check browser DevTools Console for errors
2. Verify `clearAllStores()` is being called in:
   - `settingsModal.jsx` (logout button)
   - `apiRequest.js` (401/403 interceptor)
3. Check that all stores have a `reset()` function
4. Verify localStorage items are being removed

## Technical Details

### Stores Modified
All stores now have a `reset()` function:
- `authStore.js` - Clears current user and hydration state
- `calendarStore.js` - Clears events cache
- `colorSettingsStore.js` - Resets to default theme and settings
- `hiddenEventsStore.js` - Clears hidden events list
- `hiddenCoursesStore.js` - Clears hidden courses list
- `mailSettingsStore.js` - Clears mail settings
- `notificationStore.js` - Clears notifications

### Session Manager
New file: `client/src/utils/sessionManager.js`
- `clearAllStores()` - Clears all stores and localStorage
- `initializeSession()` - Placeholder for future session initialization logic

### Integration Points
1. **Logout Button** (`settingsModal.jsx`)
   - Calls `clearAllStores()` before navigation

2. **API Interceptor** (`apiRequest.js`)
   - Calls `clearAllStores()` on 401/403 errors
   - Redirects to login page with original URL preserved

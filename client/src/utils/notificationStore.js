import { create } from 'zustand';

let id = 0;

const useNotificationStore = create(set => ({
    notifications: [],
    notify: (notif) => set(state => ({
        notifications: [
            ...state.notifications,
            { ...notif, id: ++id }
        ]
    })),
    remove: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
    }))
}));

export default useNotificationStore;
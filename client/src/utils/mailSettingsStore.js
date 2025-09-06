import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiRequest from './apiRequest'

const useMailSettingsStore = create(persist((set, get) => ({
  email: '',
  login: '',
  encPass: '', // base64 of RSA-encrypted password
  tourDone: false,
  setLocal: (p) => set(p),
  loadFromServer: async () => {
    const { data } = await apiRequest.get('/mail-settings')
    const cfg = data?.mailSettings || {}
    set({ email: cfg.email || '', login: cfg.login || '', tourDone: !!cfg.tourDone })
  },
  saveToServer: async (partial) => {
    const { data } = await apiRequest.patch('/mail-settings', partial)
    const cfg = data?.mailSettings || {}
    set({ email: cfg.email || '', login: cfg.login || '', tourDone: !!cfg.tourDone })
  }
})))

export default useMailSettingsStore

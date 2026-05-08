import { create } from 'zustand'
import axiosInstance from '../lib/axios'

const useAuthStore = create((set) => ({
  user: null,          // current logged in user
  isLoading: false,    // for loading states

  // register
  register: async (data) => {
    set({ isLoading: true })
    try {
      const res = await axiosInstance.post('/auth/register', data)
      set({ user: res.data.user, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // login
  login: async (data) => {
    set({ isLoading: true })
    try {
      const res = await axiosInstance.post('/auth/login', data)
      set({ user: res.data.user, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // get current user — called on page refresh
  getMe: async () => {
    try {
      const res = await axiosInstance.get('/auth/me')
      set({ user: res.data.user })
    } catch (error) {
      set({ user: null })
      console.log("error message", error)
    }
  },

  // logout
  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout')
      set({ user: null })
    } catch (error) {
      set({ user: null })
        console.log("error message", error)
    }
  }
}))

export default useAuthStore
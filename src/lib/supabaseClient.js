import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const customStorage = {
  getItem: (key) => {
    return window.localStorage.getItem(key) || window.sessionStorage.getItem(key)
  },
  setItem: (key, value) => {
    if (window.localStorage.getItem('remember_me') === 'true') {
      window.localStorage.setItem(key, value)
    } else {
      window.sessionStorage.setItem(key, value)
    }
  },
  removeItem: (key) => {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage
  }
})

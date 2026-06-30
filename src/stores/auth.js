import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '@/lib/pb'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  async function init() {
    loading.value = true
    if (pb.authStore.isValid) {
      user.value = pb.authStore.model
    }
    loading.value = false
  }

  async function login(email, password) {
    const authData = await pb.collection('users').authWithPassword(email, password)
    user.value = authData.record
  }

  async function logout() {
    pb.authStore.clear()
    user.value = null
  }

  return { user, loading, init, login, logout }
})

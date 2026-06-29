import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pb } from '@/lib/pb'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)   // pb.authStore.model (запись из коллекции users)
  const profile = ref(null)   // запись из коллекции profiles
  const loading = ref(true)

  const isAdmin        = computed(() => profile.value?.role === 'admin')
  const isAdvertiser   = computed(() => profile.value?.role === 'advertiser')
  const canSendNews    = computed(() => profile.value?.can_send_news === true)
  const hasActiveStats = computed(() => profile.value?.stats_enabled === true)

  // ─── fetchProfile: ищем по полю user (не по id записи профиля!) ──────
  async function fetchProfile(userId) {
    try {
      const res = await pb.collection('profiles').getList(1, 1, {
        filter: `user = "${userId}"`,
      })
      profile.value = res.items[0] || null
    } catch (e) {
      profile.value = null
    }
  }

  // ─── init: восстановить сессию из localStorage ───────────────────────
  async function init() {
    loading.value = true
    if (pb.authStore.isValid) {
      user.value = pb.authStore.model
      await fetchProfile(pb.authStore.model.id)
    }
    loading.value = false

    pb.authStore.onChange((token, model) => {
      if (model) {
        user.value = model
        fetchProfile(model.id)
      } else {
        user.value    = null
        profile.value = null
      }
    })
  }

  // ─── register ─────────────────────────────────────────────────────────
  async function register(formData) {
    // 1. Создаём auth-запись в коллекции users
    const authData = await pb.collection('users').create({
      email:           formData.email,
      password:        formData.password,
      passwordConfirm: formData.password,
    })

    // 2. Авторизуемся, чтобы получить токен для создания профиля
    const loginData = await pb.collection('users').authWithPassword(
      formData.email,
      formData.password
    )
    user.value = loginData.record

    // 3. Создаём профиль, связанный с user
    const newProfile = await pb.collection('profiles').create({
      user:                    loginData.record.id,
      email:                   formData.email,
      company_name:            formData.company_name,
      brand_name:              formData.brand_name || '',
      inn:                     formData.inn,
      contact_person:          formData.contact_person,
      phone:                   formData.phone,
      advertiser_type:         formData.advertiser_type,
      advertiser_type_custom:  formData.advertiser_type_custom || '',
      role:                    'advertiser',
      can_send_news:           false,
      stats_enabled:           false,
    })
    profile.value = newProfile

    return authData
  }

  // ─── login ────────────────────────────────────────────────────────────
  async function login(email, password) {
    const authData = await pb.collection('users').authWithPassword(email, password)
    user.value = authData.record
    await fetchProfile(authData.record.id)
    return authData
  }

  // ─── logout ───────────────────────────────────────────────────────────
  async function logout() {
    pb.authStore.clear()
    user.value    = null
    profile.value = null
  }

  // ─── updateProfile ────────────────────────────────────────────────────
  async function updateProfile(updates) {
    if (!profile.value?.id) return
    const updated = await pb.collection('profiles').update(profile.value.id, updates)
    profile.value = updated
  }

  return {
    user, profile, loading,
    isAdmin, isAdvertiser, canSendNews, hasActiveStats,
    init, register, login, logout, updateProfile, fetchProfile,
  }
})

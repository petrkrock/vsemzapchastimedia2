import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '@/lib/pb'

export const useRequestsStore = defineStore('requests', () => {
  const requests    = ref([])   // заявки текущего рекламодателя
  const allRequests = ref([])   // все заявки (для админа)
  const loading     = ref(false)

  // ─── рекламодатель ────────────────────────────────────────────────────
  async function fetchMyRequests(advertiserId) {
    loading.value = true
    try {
      const res = await pb.collection('placement_requests').getList(1, 500, {
        filter: `advertiser_id = "${advertiserId}"`,
        sort: '-created',
        expand: 'assigned_slot_id',
      })
      requests.value = res.items
    } catch (e) {
      requests.value = []
    } finally {
      loading.value = false
    }
  }

  // ─── администратор ───────────────────────────────────────────────────
  async function fetchAllRequests() {
    loading.value = true
    try {
      const res = await pb.collection('placement_requests').getList(1, 500, {
        sort: '-created',
        expand: 'advertiser_id,assigned_slot_id',
      })
      // Нормализуем expand: добавляем profiles как вложенный объект
      allRequests.value = res.items.map(r => ({
        ...r,
        profiles: r.expand?.advertiser_id || null,
        ad_slots: r.expand?.assigned_slot_id || null,
      }))
    } catch (e) {
      allRequests.value = []
    } finally {
      loading.value = false
    }
  }

  // ─── создание заявки ─────────────────────────────────────────────────
  async function createRequest(payload) {
    const data = await pb.collection('placement_requests').create(payload)
    return data
  }

  // ─── обновление заявки ───────────────────────────────────────────────
  async function updateRequest(id, updates) {
    const data = await pb.collection('placement_requests').update(id, {
      ...updates,
    })
    return data
  }

  async function requestRenewal(id) {
    return updateRequest(id, { renewal_requested: true })
  }

  // ─── утилиты ─────────────────────────────────────────────────────────
  function isDueSoon(request) {
    if (!request.actual_end_date) return false
    const end = new Date(request.actual_end_date)
    const now = new Date()
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return daysLeft <= 14 && daysLeft > 0
  }

  return {
    requests, allRequests, loading,
    fetchMyRequests, fetchAllRequests,
    createRequest, updateRequest, requestRenewal,
    isDueSoon,
  }
})

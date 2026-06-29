import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '@/lib/pb'

export const useSlotsStore = defineStore('slots', () => {
  const slots   = ref([])
  const pricing = ref([])
  const loading = ref(false)

  // ─── слоты ───────────────────────────────────────────────────────────
  async function fetchSlots() {
    loading.value = true
    try {
      const res = await pb.collection('ad_slots').getList(1, 500, {
        sort: 'format_type,slot_number',
        expand: 'current_advertiser_id',
      })
      slots.value = res.items
    } catch (e) {
      slots.value = []
    } finally {
      loading.value = false
    }
  }

  // ─── тарифы ──────────────────────────────────────────────────────────
  async function fetchPricing() {
    try {
      const res = await pb.collection('pricing_config').getList(1, 50)
      pricing.value = res.items
    } catch (e) {
      pricing.value = []
    }
  }

  /**
   * Найти тариф по типу формата.
   * Для баннеров пробуем "banner_N" сначала, потом просто "banner".
   */
  function getPricing(formatType) {
    return pricing.value.find(p => p.format_type === formatType)
      || pricing.value.find(p => p.format_type === 'banner' && formatType?.startsWith('banner'))
      || null
  }

  /**
   * Вычислить стоимость с учётом скидки за срок.
   */
  function calculatePrice(formatType, months) {
    const p = getPricing(formatType)
    if (!p) return 0
    const discount = getDiscount(p, months)
    return p.base_price_monthly * months * (1 - discount / 100)
  }

  /**
   * Найти скидку для данного тарифа и срока.
   * duration_discounts: [{ months: 3, discount: 5 }, ...]
   */
  function getDiscount(p, months) {
    if (!Array.isArray(p?.duration_discounts) || !p.duration_discounts.length) return 0
    const eligible = p.duration_discounts
      .filter(d => months >= d.months)
      .sort((a, b) => b.months - a.months)
    return eligible[0]?.discount || 0
  }

  /**
   * Доступные сроки размещения из pricing_config.available_durations.
   * Fallback: [1, 3, 6, 12] если не задано.
   */
  function getAvailableDurations(formatType) {
    const p = getPricing(formatType)
    if (Array.isArray(p?.available_durations) && p.available_durations.length) {
      return [...p.available_durations].sort((a, b) => a - b)
    }
    const min = p?.min_months || 1
    return [1, 3, 6, 12].filter(m => m >= min)
  }

  /**
   * Статус слота: free / releasing (< 30 дней) / occupied
   */
  function getSlotStatus(slot) {
    if (!slot) return 'free'
    if (!slot.is_occupied) return 'free'
    if (!slot.occupied_until) return 'occupied'
    const daysLeft = Math.ceil(
      (new Date(slot.occupied_until) - new Date()) / (1000 * 60 * 60 * 24)
    )
    return daysLeft <= 30 ? 'releasing' : 'occupied'
  }

  function getSlotsByFormat(formatType) {
    return slots.value.filter(s => s.format_type === formatType)
  }

  // ─── обновление тарифа (только для админа) ───────────────────────────
  async function updatePricing(id, updates) {
    const updated = await pb.collection('pricing_config').update(id, updates)
    const idx = pricing.value.findIndex(p => p.id === id)
    if (idx !== -1) pricing.value[idx] = updated
    return updated
  }

  return {
    slots, pricing, loading,
    fetchSlots, fetchPricing,
    getPricing, calculatePrice, getDiscount, getAvailableDurations,
    getSlotStatus, getSlotsByFormat,
    updatePricing,
  }
})

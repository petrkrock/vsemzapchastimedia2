import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '@/lib/pb'

export const useStatsStore = defineStore('stats', () => {
  const dailyStats = ref([])
  const allStats   = ref([])
  const config     = ref(null)
  const loading    = ref(false)

  /**
   * Загрузить статистику рекламодателя.
   * @param {string}      advertiserId  - id профиля
   * @param {string|null} fromDate      - "YYYY-MM-DD" или null
   * @param {string|null} toDate        - "YYYY-MM-DD" или null
   * @param {string|null} formatType    - 'sponsor_platform' и т.д., или null = все форматы
   */
  async function fetchMyStats(advertiserId, fromDate, toDate, formatType = null) {
    loading.value = true
    try {
      let filter = `advertiser_id = "${advertiserId}"`
      if (fromDate)    filter += ` && date >= "${fromDate} 00:00:00"`
      if (toDate)      filter += ` && date <= "${toDate} 23:59:59"`
      if (formatType)  filter += ` && format_type = "${formatType}"`

      const res = await pb.collection('advertiser_stats').getList(1, 500, {
        filter,
        sort: 'date',
      })
      dailyStats.value = res.items
    } catch (e) {
      dailyStats.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchStatsConfig(advertiserId) {
    try {
      const res = await pb.collection('stats_config').getList(1, 1, {
        filter: `advertiser_id = "${advertiserId}"`,
      })
      config.value = res.items[0] || null
    } catch (e) {
      config.value = null
    }
  }

  async function fetchAllConfigs() {
    try {
      const res = await pb.collection('stats_config').getList(1, 500, {
        expand: 'advertiser_id',
      })
      allStats.value = res.items
    } catch (e) {
      allStats.value = []
    }
  }

  async function saveStatsConfig(advertiserId, data) {
    const payload = { advertiser_id: advertiserId, ...data }
    if (config.value?.id) {
      const updated = await pb.collection('stats_config').update(config.value.id, payload)
      config.value = updated
    } else {
      const created = await pb.collection('stats_config').create(payload)
      config.value = created
    }
  }

  async function addImpressionsRecord(advertiserId, date, impressions, formatType) {
    const dateFrom = `${date} 00:00:00`
    const dateTo   = `${date} 23:59:59`
    try {
      let filter = `advertiser_id = "${advertiserId}" && date >= "${dateFrom}" && date <= "${dateTo}"`
      if (formatType) filter += ` && format_type = "${formatType}"`

      const res = await pb.collection('advertiser_stats').getList(1, 1, { filter })
      const payload = { impressions }
      if (formatType) payload.format_type = formatType

      if (res.items.length) {
        await pb.collection('advertiser_stats').update(res.items[0].id, payload)
      } else {
        await pb.collection('advertiser_stats').create({
          advertiser_id: advertiserId,
          date:          `${date} 00:00:00`,
          format_type:   formatType || null,
          impressions,
        })
      }
    } catch (e) {
      console.error('addImpressionsRecord:', e)
    }
  }

  function getAggregated() {
    const data = dailyStats.value
    if (!data.length) return { total: 0, avgPerDay: 0, best: 0 }
    const total     = data.reduce((s, d) => s + (d.impressions || 0), 0)
    const avgPerDay = Math.round(total / data.length)
    const best      = Math.max(...data.map(d => d.impressions || 0))
    return { total, avgPerDay, best }
  }

  return {
    dailyStats, allStats, config, loading,
    fetchMyStats, fetchStatsConfig, fetchAllConfigs,
    saveStatsConfig, addImpressionsRecord,
    getAggregated,
  }
})

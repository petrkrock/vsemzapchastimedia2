<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold mb-1">Загруженность слотов</h1>
    <p class="text-sm text-brand-gray-dark mb-5">Текущая занятость всех рекламных мест</p>

    <!-- Фильтр периода -->
    <div class="flex items-center gap-3 flex-wrap mb-5">
      <div class="flex gap-2">
        <button v-for="p in periodFilters" :key="p.key" @click="setPeriod(p.key)"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          :class="activePeriod === p.key ? 'bg-brand-red text-white' : 'bg-white text-brand-gray-dark border border-brand-gray-mid'"
        >{{ p.label }}</button>
      </div>
      <div class="flex items-center gap-2 ml-auto">
        <input type="date" v-model="fromDate" class="input py-1.5 text-xs w-auto" />
        <span class="text-brand-gray-dark text-xs">—</span>
        <input type="date" v-model="toDate"   class="input py-1.5 text-xs w-auto" />
      </div>
    </div>

    <!-- Легенда -->
    <div class="flex flex-wrap gap-4 text-xs text-brand-gray-dark mb-4">
      <span class="flex items-center gap-1.5"><span class="w-4 h-3 rounded bg-green-100 inline-block border border-green-200"></span>Активно</span>
      <span class="flex items-center gap-1.5"><span class="w-4 h-3 rounded bg-yellow-100 inline-block border border-yellow-200"></span>Освобождается</span>
      <span class="flex items-center gap-1.5"><span class="w-4 h-3 rounded bg-gray-100 inline-block border border-gray-200"></span>Свободно</span>
    </div>

    <!-- KPI -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      <div class="card text-center py-3">
        <div class="text-2xl font-extrabold">{{ totalSlots }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Всего слотов</div>
      </div>
      <div class="card text-center py-3">
        <div class="text-2xl font-extrabold text-green-600">{{ activeSlots }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Активных размещений</div>
      </div>
      <div class="card text-center py-3">
        <div class="text-2xl font-extrabold text-brand-red">{{ freeSlots }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Свободно</div>
      </div>
      <div class="card text-center py-3">
        <div class="text-2xl font-extrabold text-blue-600">{{ occupancyPct }}%</div>
        <div class="text-xs text-brand-gray-dark mt-1">Загруженность</div>
      </div>
    </div>

    <div v-if="loading" class="py-12 text-center text-brand-gray-dark">Загрузка...</div>

    <div v-else class="space-y-4">
      <div v-for="section in sections" :key="section.key" class="card overflow-x-auto">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-sm">{{ section.label }}</h2>
          <div class="text-xs text-brand-gray-dark">
            {{ getActiveCount(section.formatType) }} активно из {{ getSlots(section.formatType).length }}
          </div>
        </div>

        <table class="w-full text-xs" style="min-width:520px">
          <thead>
            <tr>
              <th class="text-left pb-2 pr-3 font-semibold text-brand-gray-dark" style="width:120px">Слот</th>
              <th v-for="m in months" :key="m.toISOString()" class="text-center pb-2 px-1 font-semibold text-brand-gray-dark" style="min-width:60px">
                {{ fmtMonthShort(m) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in getSlots(section.formatType)" :key="slot.id" class="border-t border-brand-gray/40">
              <td class="py-1.5 pr-3">
                <div class="font-semibold">№{{ slot.slot_number }}</div>
                <div class="text-[10px] text-brand-gray-dark truncate max-w-[100px]">
                  {{ slot.expand?.current_advertiser_id?.brand_name || slot.expand?.current_advertiser_id?.company_name || '' }}
                </div>
              </td>
              <td v-for="m in months" :key="m.toISOString()" class="py-1.5 px-1">
                <div class="h-6 rounded text-[10px] flex items-center justify-center font-semibold"
                  :class="getCellClass(slot, m)"
                  :title="getCellTitle(slot, m)"
                >{{ getCellText(slot, m) }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Сводная таблица по месяцам -->
    <div class="card mt-4 overflow-x-auto">
      <h2 class="font-bold mb-3">Загруженность по месяцам</h2>
      <table class="w-full text-xs" style="min-width:360px">
        <thead>
          <tr class="text-brand-gray-dark">
            <th class="text-left pb-2 font-semibold">Месяц</th>
            <th class="text-center pb-2 font-semibold">Активных слотов</th>
            <th class="text-center pb-2 font-semibold">Загруженность</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in months" :key="m.toISOString()" class="border-t border-brand-gray/50">
            <td class="py-2 font-medium">{{ fmtMonth(m) }}</td>
            <td class="py-2 text-center font-semibold text-green-700">{{ getMonthActive(m) }} / {{ totalSlots }}</td>
            <td class="py-2 text-center">
              <span class="px-2 py-0.5 rounded-full font-semibold"
                :class="getMonthPct(m) >= 70 ? 'bg-green-100 text-green-800' : getMonthPct(m) >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'"
              >{{ getMonthPct(m) }}%</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSlotsStore }   from '@/stores/slots'
import { useRequestsStore } from '@/stores/requests'

const slotsStore = useSlotsStore()
const reqStore   = useRequestsStore()
const loading    = ref(true)
const activePeriod = ref('6')

const now = new Date()
const fromDate = ref(now.toISOString().split('T')[0])
const toDate   = ref(new Date(now.getFullYear(), now.getMonth() + 6, 0).toISOString().split('T')[0])

const periodFilters = [
  { key: '3',  label: '3 месяца' },
  { key: '6',  label: '6 месяцев' },
  { key: '12', label: '12 месяцев' },
]

function setPeriod(key) {
  activePeriod.value = key
  const from = new Date()
  const to   = new Date(from.getFullYear(), from.getMonth() + parseInt(key), 0)
  fromDate.value = from.toISOString().split('T')[0]
  toDate.value   = to.toISOString().split('T')[0]
}

const sections = [
  { key: 'sponsor',   label: '⭐ Спонсоры платформы',    formatType: 'sponsor_platform' },
  { key: 'suppliers', label: '🏆 Топ-10 поставщиков',    formatType: 'top10_suppliers' },
  { key: 'brands',    label: '🥇 Рекомендуемые бренды',  formatType: 'recommended_brands' },
  { key: 'banner',    label: '🖼 Баннеры',               formatType: 'banner' },
]

// Месяцы в выбранном диапазоне
const months = computed(() => {
  const result = []
  const start = new Date(fromDate.value)
  const end   = new Date(toDate.value)
  let cur = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cur <= end) {
    result.push(new Date(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return result
})

const totalSlots   = computed(() => slotsStore.slots.length)
const activeSlots  = computed(() => slotsStore.slots.filter(s => s.is_occupied).length)
const freeSlots    = computed(() => totalSlots.value - activeSlots.value)
const occupancyPct = computed(() => totalSlots.value ? Math.round(activeSlots.value / totalSlots.value * 100) : 0)

function getSlots(fmt) { return slotsStore.slots.filter(s => s.format_type === fmt) }
function getActiveCount(fmt) { return getSlots(fmt).filter(s => s.is_occupied).length }

function getMonthRequests(slot, month) {
  const mStart = new Date(month.getFullYear(), month.getMonth(), 1)
  const mEnd   = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  return reqStore.allRequests.filter(r =>
    r.assigned_slot_id === slot.id &&
    ['active', 'payment_pending', 'paid'].includes(r.status) &&
    r.actual_start_date && r.actual_end_date &&
    new Date(r.actual_start_date) <= mEnd &&
    new Date(r.actual_end_date)   >= mStart
  )
}

function getCellClass(slot, month) {
  const reqs = getMonthRequests(slot, month)
  if (!reqs.length) return 'bg-gray-100 text-gray-400'
  const r = reqs[0]
  const end = new Date(r.actual_end_date)
  const mEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  if (r.status === 'active' && end <= mEnd && end > new Date()) return 'bg-yellow-100 border border-yellow-300 text-yellow-800'
  return 'bg-green-100 border border-green-200 text-green-800'
}

function getCellText(slot, month) {
  const reqs = getMonthRequests(slot, month)
  return reqs.length ? '●' : ''
}

function getCellTitle(slot, month) {
  const reqs = getMonthRequests(slot, month)
  if (!reqs.length) return 'Свободно'
  const r = reqs[0]
  const company = r.profiles?.company_name || r.expand?.advertiser_id?.company_name || ''
  return `${company} · ${fmtDate(r.actual_start_date)} — ${fmtDate(r.actual_end_date)}`
}

function getMonthActive(month) {
  return slotsStore.slots.reduce((n, slot) => n + (getMonthRequests(slot, month).length > 0 ? 1 : 0), 0)
}
function getMonthPct(month) {
  return totalSlots.value ? Math.round(getMonthActive(month) / totalSlots.value * 100) : 0
}

function fmtMonth(d)      { return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) }
function fmtMonthShort(d) { return d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '') }
function fmtDate(d)       { return d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '–' }

onMounted(async () => {
  await Promise.all([slotsStore.fetchSlots(), reqStore.fetchAllRequests()])
  loading.value = false
})
</script>

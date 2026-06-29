<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <div class="flex items-start justify-between gap-3 mb-1 flex-wrap">
      <div>
        <h1 class="text-2xl font-extrabold">Статистика размещения</h1>
        <p class="text-sm text-brand-gray-dark mt-1">
          ID: <span class="font-mono font-semibold text-brand-black">{{ auth.profile?.id?.slice(0,8).toUpperCase() }}</span>
          · привязан к карточке профиля
        </p>
      </div>
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        Активное размещение
      </span>
    </div>

    <!-- Нет доступа -->
    <div v-if="!auth.hasActiveStats" class="card text-center py-12 mt-6">
      <div class="text-4xl mb-3">🔒</div>
      <h2 class="font-bold mb-1">Статистика недоступна</h2>
      <p class="text-sm text-brand-gray-dark max-w-sm mx-auto">
        Раздел доступен только для рекламодателей с активным размещением, у которых администратор включил сбор статистики.
      </p>
    </div>

    <template v-else>
      <!-- Фильтры: формат + период дат -->
      <div class="card mt-5 mb-5 space-y-3">
        <!-- Выбор формата — выпадающий список, появляется только если > 1 активного размещения -->
        <div class="flex items-center gap-3 flex-wrap">
          <div class="flex-1 min-w-[200px]">
            <label class="label">Формат рекламы</label>
            <select v-model="selectedFormatKey" class="input" @change="loadStats">
              <option value="all">Вся статистика (все форматы)</option>
              <option
                v-for="r in activeRequests"
                :key="r.id"
                :value="r.id"
              >
                {{ FORMAT_LABELS[r.format_type] }}
                <template v-if="r.slot_number"> — слот №{{ r.slot_number }}</template>
              </option>
            </select>
          </div>

          <!-- Активный формат — инфо карточка -->
          <div
            v-if="selectedFormatKey !== 'all' && selectedRequest"
            class="px-3 py-2 bg-brand-gray rounded-xl text-xs flex items-center gap-2 flex-shrink-0"
          >
            <span class="text-lg">📢</span>
            <div>
              <div class="font-semibold">{{ FORMAT_LABELS[selectedRequest.format_type] }}
                <span v-if="selectedRequest.slot_number"> · слот №{{ selectedRequest.slot_number }}</span>
              </div>
              <div class="text-brand-gray-dark">
                {{ formatDate(selectedRequest.actual_start_date) }} — {{ formatDate(selectedRequest.actual_end_date) }}
              </div>
            </div>
          </div>
          <div v-else-if="selectedFormatKey === 'all' && activeRequests.length > 1" class="px-3 py-2 bg-brand-gray rounded-xl text-xs flex-shrink-0">
            <div class="font-semibold">Все {{ activeRequests.length }} активных размещения</div>
            <div class="text-brand-gray-dark">Суммарная статистика</div>
          </div>
        </div>

        <!-- Фильтр по периоду -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              v-for="p in periods"
              :key="p.key"
              @click="setPeriod(p.key)"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
              :class="activePeriod === p.key ? 'bg-brand-red text-white' : 'bg-white text-brand-gray-dark border border-brand-gray-mid'"
            >{{ p.label }}</button>
          </div>
          <div class="flex items-center gap-2">
            <input type="date" v-model="fromDate" class="input py-1.5 text-xs w-auto" @change="onCustomDate" />
            <span class="text-brand-gray-dark text-xs">—</span>
            <input type="date" v-model="toDate"   class="input py-1.5 text-xs w-auto" @change="onCustomDate" />
          </div>
        </div>
      </div>

      <!-- KPI -->
      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="card text-center">
          <div class="text-3xl font-extrabold text-brand-red">{{ agg.total.toLocaleString('ru-RU') }}</div>
          <div class="text-xs text-brand-gray-dark mt-1">Показов клиентам</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-extrabold text-brand-black">{{ agg.avgPerDay.toLocaleString('ru-RU') }}</div>
          <div class="text-xs text-brand-gray-dark mt-1">Показов / день, ср.</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-extrabold text-green-600">{{ agg.best.toLocaleString('ru-RU') }}</div>
          <div class="text-xs text-brand-gray-dark mt-1">Лучший день</div>
        </div>
      </div>

      <!-- График -->
      <div class="card mb-5">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 class="font-bold">Показы по дням</h2>
          <div class="flex items-center gap-3 text-xs text-brand-gray-dark">
            <span v-if="selectedFormatKey !== 'all'" class="tag-red">
              {{ FORMAT_LABELS[selectedRequest?.format_type] }}
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block w-3 h-3 rounded-sm bg-brand-red"></span>Показы
            </span>
          </div>
        </div>

        <div v-if="statsStore.loading" class="py-8 text-center text-brand-gray-dark text-sm">Загрузка...</div>
        <div v-else-if="chartData.length === 0" class="py-8 text-center text-brand-gray-dark text-sm">
          Нет данных за выбранный период
        </div>
        <svg v-else viewBox="0 0 700 240" class="w-full" style="max-height:260px;">
          <line v-for="g in 4" :key="g"
            :x1="44" :y1="gridY(g-1)" :x2="690" :y2="gridY(g-1)"
            stroke="#E0E0E0" stroke-width="1" stroke-dasharray="3,3"
          />
          <text v-for="g in 4" :key="'l'+g"
            :x="40" :y="gridY(g-1)+3" font-size="9" fill="#6B6B6B" text-anchor="end"
          >{{ gridLabel(g-1) }}</text>
          <rect
            v-for="(d, i) in chartData" :key="i"
            :x="barX(i) - barW/2" :y="barY(d.impressions)"
            :width="barW" :height="220 - barY(d.impressions) + 10"
            fill="#E8231A" rx="2"
          />
          <text
            v-for="(d, i) in xLabels" :key="'xl'+i"
            :x="barX(d.index)" y="232"
            font-size="9" fill="#6B6B6B" text-anchor="middle"
          >{{ d.label }}</text>
        </svg>
      </div>

      <!-- Таблица -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold">Детально по дням</h2>
          <button @click="exportCsv" class="text-brand-red text-xs font-semibold hover:underline">Экспорт CSV</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs text-brand-gray-dark uppercase tracking-wide border-b border-brand-gray-mid">
                <th class="text-left pb-2 font-semibold">Дата</th>
                <th v-if="selectedFormatKey === 'all' && activeRequests.length > 1" class="text-left pb-2 font-semibold">Формат</th>
                <th class="text-right pb-2 font-semibold">Показов клиентам</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in tableData" :key="d.date + d.advertiser_id" class="border-b border-brand-gray/50 last:border-0">
                <td class="py-2 text-xs">{{ formatDate(d.date) }}</td>
                <td v-if="selectedFormatKey === 'all' && activeRequests.length > 1" class="py-2 text-xs text-brand-gray-dark">
                  {{ FORMAT_LABELS[d.format_type] || '—' }}
                </td>
                <td class="py-2 text-right text-xs font-semibold text-brand-red">{{ (d.impressions || 0).toLocaleString('ru-RU') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="text-xs text-brand-gray-dark mt-4 text-center">
        Данные обновляются ежедневно. Раздел доступен для рекламодателей с активным размещением.
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore }    from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { useStatsStore }   from '@/stores/stats'

const auth       = useAuthStore()
const reqStore   = useRequestsStore()
const statsStore = useStatsStore()

const activePeriod      = ref('30')
const fromDate          = ref('')
const toDate            = ref('')
const selectedFormatKey = ref('all')   // 'all' или id конкретной заявки

const FORMAT_LABELS = {
  sponsor_platform:   'Спонсор платформы',
  top10_suppliers:    'Топ-10 поставщиков',
  recommended_brands: 'Рекомендуемые бренды',
  banner:             'Баннер',
}

const periods = [
  { key: '7',  label: '7 дней' },
  { key: '30', label: '30 дней' },
  { key: '90', label: '90 дней' },
]

// Все активные заявки рекламодателя
const activeRequests = computed(() =>
  reqStore.requests.filter(r => r.status === 'active')
)

// Выбранная конкретная заявка (если не 'all')
const selectedRequest = computed(() =>
  selectedFormatKey.value === 'all'
    ? null
    : activeRequests.value.find(r => r.id === selectedFormatKey.value) || null
)

// ─── загрузка данных ─────────────────────────────────────────────────

function setPeriod(key) {
  activePeriod.value = key
  const to   = new Date()
  const from = new Date()
  from.setDate(from.getDate() - parseInt(key))
  toDate.value   = to.toISOString().split('T')[0]
  fromDate.value = from.toISOString().split('T')[0]
  loadStats()
}

function onCustomDate() {
  activePeriod.value = 'custom'
  loadStats()
}

async function loadStats() {
  if (!auth.profile?.id) return

  if (selectedFormatKey.value === 'all') {
    // Загружаем по всем активным размещениям
    await statsStore.fetchMyStats(auth.profile.id, fromDate.value, toDate.value, null)
  } else {
    // Загружаем только по конкретному формату выбранной заявки
    const req = selectedRequest.value
    await statsStore.fetchMyStats(
      auth.profile.id,
      fromDate.value,
      toDate.value,
      req?.format_type || null
    )
  }
}

const agg = computed(() => statsStore.getAggregated())

// ─── chart ───────────────────────────────────────────────────────────

const chartData = computed(() => statsStore.dailyStats)

const maxImp = computed(() => {
  const m = Math.max(...chartData.value.map(d => d.impressions || 0), 1)
  return m * 1.15
})

const padL = 44, padT = 10, innerW = 646, innerH = 210

function barX(i) {
  return padL + (i + 0.5) * (innerW / (chartData.value.length || 1))
}
const barW = computed(() =>
  Math.max((innerW / (chartData.value.length || 1)) * 0.6, 3)
)
function barY(v)      { return padT + innerH - (v / maxImp.value) * innerH }
function gridY(g)     { return padT + innerH - (g / 3) * innerH }
function gridLabel(g) { return Math.round(maxImp.value / 3 * g).toLocaleString('ru-RU') }

const xLabels = computed(() => {
  const n = chartData.value.length
  const every = Math.max(1, Math.ceil(n / 8))
  return chartData.value
    .map((d, i) => ({ index: i, label: fmtShort(d.date) }))
    .filter((_, i) => i % every === 0 || i === n - 1)
})

// ─── table ───────────────────────────────────────────────────────────

const tableData = computed(() => [...statsStore.dailyStats].reverse())

// ─── utils ───────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtShort(d) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function exportCsv() {
  const hasFormat = selectedFormatKey.value === 'all' && activeRequests.value.length > 1
  const header = hasFormat ? ['Дата', 'Формат', 'Показов'] : ['Дата', 'Показов']
  const rows = [
    header,
    ...tableData.value.map(d =>
      hasFormat
        ? [d.date, FORMAT_LABELS[d.format_type] || '', d.impressions]
        : [d.date, d.impressions]
    ),
  ]
  const csv = rows.map(r => r.join(';')).join('\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `statistics_${selectedFormatKey.value === 'all' ? 'all' : selectedRequest.value?.format_type}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  if (auth.profile?.id) {
    await reqStore.fetchMyRequests(auth.profile.id)
    setPeriod('30')
  }
})
</script>

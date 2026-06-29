<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold mb-1">Управление ценами</h1>
    <p class="text-sm text-brand-gray-dark mb-6">Тарифы, скидки и доступные сроки размещения по каждому формату</p>

    <div v-if="loading" class="py-12 text-center text-brand-gray-dark">Загрузка...</div>

    <div v-else class="space-y-4">
      <div v-for="p in pricing" :key="p.id" class="card">
        <div class="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
          <div class="flex-1">
            <div class="font-bold text-brand-black">{{ FORMAT_LABELS[p.format_type] || p.format_type }}</div>
            <div class="text-xs text-brand-gray-dark mt-0.5">Обновлено {{ formatDate(p.updated) }}</div>
          </div>
        </div>

        <!-- Основная цена -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label class="label">Цена/мес (₽)</label>
            <input v-model.number="edits[p.id].base_price_monthly" type="number" class="input" min="0" step="1000" />
          </div>
          <div>
            <label class="label">Мин. месяцев</label>
            <input v-model.number="edits[p.id].min_months" type="number" class="input" min="1" max="12" />
          </div>
          <div>
            <label class="label">Бонус при размещении</label>
            <input v-model="edits[p.id].bonus_description" type="text" class="input" placeholder="Напр.: 2 новости/мес" />
          </div>
        </div>

        <!-- Доступные сроки -->
        <div class="mb-4">
          <label class="label">Доступные сроки размещения</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="m in ALL_DURATIONS"
              :key="m"
              @click="toggleDuration(p.id, m)"
              class="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
              :class="edits[p.id].available_durations.includes(m)
                ? 'bg-brand-red text-white border-brand-red'
                : 'bg-white text-brand-black border-brand-gray-mid hover:border-brand-red'"
            >
              {{ m }} мес.
            </button>
          </div>
          <p class="text-xs text-brand-gray-dark mt-1">
            Выбрано: {{ edits[p.id].available_durations.slice().sort((a,b)=>a-b).join(', ') || 'нет' }} мес.
          </p>
        </div>

        <!-- Скидки по срокам -->
        <div class="mb-4">
          <label class="label">Скидки по срокам</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div v-for="m in edits[p.id].available_durations.slice().sort((a,b)=>a-b)" :key="m" class="flex flex-col gap-1">
              <span class="text-[10px] text-brand-gray-dark font-semibold">{{ m }} мес.</span>
              <div class="flex items-center gap-1">
                <input
                  v-model.number="edits[p.id].duration_discounts_map[m]"
                  type="number"
                  class="input py-1 px-2 text-xs"
                  min="0" max="100" placeholder="0"
                />
                <span class="text-xs text-brand-gray-dark">%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Превью -->
        <div class="flex flex-wrap gap-2 text-xs mb-4">
          <span v-for="m in edits[p.id].available_durations.slice().sort((a,b)=>a-b)" :key="m"
            class="px-2 py-1 bg-brand-gray rounded-lg">
            {{ m }} мес.: {{ formatPrice(calcTotal(edits[p.id], m)) }}
            <span v-if="edits[p.id].duration_discounts_map[m] > 0" class="text-green-700 ml-1">
              (−{{ edits[p.id].duration_discounts_map[m] }}%)
            </span>
          </span>
        </div>

        <div class="flex gap-2">
          <button @click="save(p)" :disabled="saving[p.id]" class="btn-primary text-xs">
            <span v-if="saving[p.id]" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 inline-block"></span>
            Сохранить
          </button>
          <button @click="reset(p)" class="btn-secondary text-xs">Сбросить</button>
        </div>
      </div>
    </div>

    <div v-if="toastMsg" class="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg z-50">
      ✅ {{ toastMsg }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useSlotsStore } from '@/stores/slots'

const slotsStore = useSlotsStore()
const loading = ref(true)
const saving  = reactive({})
const toastMsg = ref('')

const pricing = ref([])
const edits   = reactive({})

const ALL_DURATIONS = [1, 3, 6, 12]

const FORMAT_LABELS = {
  sponsor_platform:   '⭐ Спонсор платформы',
  top10_suppliers:    '🏆 Топ-10 поставщиков',
  recommended_brands: '🥇 Рекомендуемые бренды',
  banner_1:           '🖼 Баннер 1 (топ)',
  banner_2:           '🖼 Баннер 2',
  banner_3:           '🖼 Баннер 3',
}

function buildEdit(p) {
  // duration_discounts — массив [{ months, discount }] в БД
  const ddArr = Array.isArray(p.duration_discounts) ? p.duration_discounts : []
  const map   = {}
  for (const d of ddArr) map[d.months] = d.discount || 0

  return {
    base_price_monthly:    p.base_price_monthly,
    min_months:            p.min_months,
    bonus_description:     p.bonus_description || '',
    available_durations:   Array.isArray(p.available_durations) ? [...p.available_durations] : [1, 3, 6, 12],
    duration_discounts_map: map,
  }
}

function initEdits() {
  for (const p of pricing.value) {
    edits[p.id] = buildEdit(p)
  }
}

function reset(p) {
  edits[p.id] = buildEdit(p)
}

function toggleDuration(id, m) {
  const arr = edits[id].available_durations
  const idx = arr.indexOf(m)
  if (idx >= 0) {
    arr.splice(idx, 1)
    delete edits[id].duration_discounts_map[m]
  } else {
    arr.push(m)
  }
}

function calcTotal(edit, months) {
  const disc = edit.duration_discounts_map[months] || 0
  return (edit.base_price_monthly || 0) * months * (1 - disc / 100)
}

async function save(p) {
  saving[p.id] = true
  try {
    const e = edits[p.id]
    // Собираем duration_discounts в массив
    const ddArr = Object.entries(e.duration_discounts_map)
      .map(([months, discount]) => ({ months: parseInt(months), discount: discount || 0 }))
      .filter(d => e.available_durations.includes(d.months))

    await slotsStore.updatePricing(p.id, {
      base_price_monthly:  e.base_price_monthly,
      min_months:          e.min_months,
      bonus_description:   e.bonus_description,
      available_durations: e.available_durations,
      duration_discounts:  ddArr,
    })
    showToast(`Тариф «${FORMAT_LABELS[p.format_type] || p.format_type}» обновлён`)
    const idx = pricing.value.findIndex(x => x.id === p.id)
    if (idx !== -1) Object.assign(pricing.value[idx], e)
  } catch (e) {
    alert('Ошибка: ' + (e.message || 'Попробуйте ещё раз'))
  } finally {
    saving[p.id] = false
  }
}

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => toastMsg.value = '', 3000)
}

function formatPrice(n) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n || 0) + ' ₽'
}
function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  await slotsStore.fetchPricing()
  pricing.value = [...slotsStore.pricing]
  initEdits()
  loading.value = false
})
</script>

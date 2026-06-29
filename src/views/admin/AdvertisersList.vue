<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold mb-1">Рекламодатели</h1>
    <p class="text-sm text-brand-gray-dark mb-5">Управление аккаунтами и правами доступа</p>

    <div class="mb-4">
      <input v-model="search" class="input max-w-sm" placeholder="Поиск по компании, email, ИНН..." />
    </div>

    <div v-if="loading" class="py-12 text-center text-brand-gray-dark">Загрузка...</div>

    <!-- Desktop -->
    <div v-else class="hidden md:block">
      <div class="bg-white rounded-xl overflow-hidden border border-brand-gray-mid">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-brand-gray text-xs text-brand-gray-dark uppercase tracking-wide">
              <th class="text-left px-4 py-3 font-semibold">Компания</th>
              <th class="text-left px-4 py-3 font-semibold">Контакт</th>
              <th class="text-left px-4 py-3 font-semibold">Тип</th>
              <th class="text-center px-4 py-3 font-semibold">Новости</th>
              <th class="text-center px-4 py-3 font-semibold">Статистика</th>
              <th class="text-left px-4 py-3 font-semibold">Дата рег.</th>
              <th class="text-right px-4 py-3 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id" class="border-t border-brand-gray/60 hover:bg-brand-gray/40">
              <td class="px-4 py-3">
                <div class="font-semibold">{{ p.company_name || '–' }}</div>
                <div class="text-xs text-brand-gray-dark">{{ p.brand_name }}</div>
                <div class="text-xs text-brand-gray-dark">ИНН: {{ p.inn }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="text-xs">{{ p.contact_person }}</div>
                <div class="text-xs text-brand-red">{{ p.email }}</div>
                <div class="text-xs text-brand-gray-dark">{{ p.phone }}</div>
              </td>
              <td class="px-4 py-3 text-xs">{{ TYPE_LABELS[p.advertiser_type] || p.advertiser_type_custom || '–' }}</td>
              <td class="px-4 py-3 text-center">
                <button
                  @click="toggleNews(p)"
                  :class="p.can_send_news ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-brand-gray-dark hover:bg-gray-200'"
                  class="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                >
                  {{ p.can_send_news ? '✓ Разрешено' : 'Запрещено' }}
                </button>
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  @click="openStatsModal(p)"
                  :class="p.stats_enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-brand-gray-dark hover:bg-gray-200'"
                  class="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                >
                  {{ p.stats_enabled ? '⚙ Настроена' : '+ Подключить' }}
                </button>
              </td>
              <td class="px-4 py-3 text-xs text-brand-gray-dark">{{ formatDate(p.created) }}</td>
              <td class="px-4 py-3 text-right">
                <button @click="viewProfile(p)" class="text-xs text-brand-red font-semibold hover:underline">Профиль</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile -->
    <div class="md:hidden space-y-3">
      <div v-for="p in filtered" :key="p.id" class="card">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-semibold">{{ p.company_name || p.email }}</div>
            <div class="text-xs text-brand-gray-dark mt-0.5">{{ p.email }}</div>
          </div>
          <div class="flex flex-col gap-1">
            <button
              @click="toggleNews(p)"
              :class="p.can_send_news ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-brand-gray-dark'"
              class="px-2 py-1 rounded-full text-[10px] font-semibold"
            >{{ p.can_send_news ? '✓ Новости' : 'Новости ✗' }}</button>
            <button
              @click="openStatsModal(p)"
              :class="p.stats_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-brand-gray-dark'"
              class="px-2 py-1 rounded-full text-[10px] font-semibold"
            >{{ p.stats_enabled ? '📊 Стат.' : '📊 —' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile modal -->
    <div v-if="selectedProfile" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="selectedProfile = null">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div class="flex justify-between mb-4">
          <h2 class="font-bold">Профиль рекламодателя</h2>
          <button @click="selectedProfile = null" class="text-xl text-brand-gray-dark">×</button>
        </div>
        <div class="space-y-2 text-sm">
          <div><span class="text-brand-gray-dark">Компания:</span> <strong>{{ selectedProfile.company_name }}</strong></div>
          <div><span class="text-brand-gray-dark">Бренд:</span> {{ selectedProfile.brand_name }}</div>
          <div><span class="text-brand-gray-dark">ИНН:</span> {{ selectedProfile.inn }}</div>
          <div><span class="text-brand-gray-dark">Контакт:</span> {{ selectedProfile.contact_person }}</div>
          <div><span class="text-brand-gray-dark">Email:</span> {{ selectedProfile.email }}</div>
          <div><span class="text-brand-gray-dark">Телефон:</span> {{ selectedProfile.phone }}</div>
          <div><span class="text-brand-gray-dark">Тип:</span> {{ TYPE_LABELS[selectedProfile.advertiser_type] || selectedProfile.advertiser_type_custom }}</div>
          <div><span class="text-brand-gray-dark">Новости:</span> {{ selectedProfile.can_send_news ? '✅ Разрешено' : '❌ Запрещено' }}</div>
          <div><span class="text-brand-gray-dark">Статистика:</span> {{ selectedProfile.stats_enabled ? '✅ Включена' : '❌ Выключена' }}</div>
        </div>
        <div class="mt-4 flex gap-2">
          <button @click="toggleNews(selectedProfile)" class="btn-secondary flex-1 text-xs">
            {{ selectedProfile.can_send_news ? 'Запретить новости' : 'Разрешить новости' }}
          </button>
          <button @click="selectedProfile = null" class="btn-primary flex-1 text-xs">Закрыть</button>
        </div>
      </div>
    </div>

    <!-- Stats config modal -->
    <div v-if="statsTarget" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="statsTarget = null">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="font-bold text-lg">Настройка статистики</h2>
            <p class="text-xs text-brand-gray-dark mt-0.5">{{ statsTarget.company_name }}</p>
          </div>
          <button @click="statsTarget = null" class="text-xl text-brand-gray-dark">×</button>
        </div>

        <div class="space-y-4">
          <!-- Вкл/выкл -->
          <div class="flex items-center justify-between px-3 py-2.5 bg-brand-gray rounded-xl">
            <div>
              <div class="text-sm font-semibold">Доступ к статистике</div>
              <div class="text-xs text-brand-gray-dark">Показать вкладку «Статистика» в кабинете</div>
            </div>
            <button
              @click="statsForm.enabled = !statsForm.enabled"
              class="relative w-11 h-6 rounded-full transition-colors"
              :class="statsForm.enabled ? 'bg-green-500' : 'bg-gray-300'"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :class="statsForm.enabled ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>

          <div>
            <label class="label">Источник данных</label>
            <select v-model="statsForm.data_source" class="input">
              <option value="internal">Внутренний счётчик платформы</option>
              <option value="yandex_metrika">Яндекс.Метрика</option>
              <option value="custom_api">Кастомный API-эндпоинт</option>
            </select>
          </div>

          <div v-if="statsForm.data_source !== 'internal'">
            <label class="label">URL API-эндпоинта</label>
            <input v-model="statsForm.api_url" class="input font-mono text-xs" placeholder="https://api.example.com/v1/stats" />
          </div>

          <div v-if="statsForm.data_source !== 'internal'">
            <label class="label">Ключ доступа (API key)</label>
            <input v-model="statsForm.api_key" type="password" class="input font-mono text-xs" placeholder="sk_live_..." />
          </div>

          <div>
            <label class="label">Частота обновления</label>
            <select v-model="statsForm.update_frequency" class="input">
              <option value="daily">Раз в сутки</option>
              <option value="hourly">Раз в час</option>
            </select>
          </div>
        </div>

        <div class="mt-5 flex gap-2">
          <button @click="statsTarget = null" class="btn-secondary flex-1 text-xs">Отмена</button>
          <button @click="saveStats" :disabled="savingStats" class="btn-primary flex-1 text-xs">
            <span v-if="savingStats" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 inline-block"></span>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { pb } from '@/lib/pb'
import { useStatsStore } from '@/stores/stats'

const statsStore = useStatsStore()
const loading = ref(true)
const advertisers = ref([])
const search = ref('')
const selectedProfile = ref(null)
const statsTarget = ref(null)
const savingStats = ref(false)
const statsForm = reactive({
  enabled: false,
  data_source: 'internal',
  api_url: '',
  api_key: '',
  update_frequency: 'daily',
})

const TYPE_LABELS = { supplier: 'Поставщик / Склад', brand: 'Бренд / Производитель', other: 'Прочее' }

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return advertisers.value
  return advertisers.value.filter(p =>
    (p.company_name || '').toLowerCase().includes(q) ||
    (p.email || '').toLowerCase().includes(q) ||
    (p.inn || '').includes(q) ||
    (p.brand_name || '').toLowerCase().includes(q)
  )
})

async function fetchAdvertisers() {
  const res = await pb.collection('profiles').getList(1, 500, {
    filter: 'role = "advertiser"',
    sort: '-created',
  })
  advertisers.value = res.items
}

async function toggleNews(profile) {
  const newVal = !profile.can_send_news
  await pb.collection('profiles').update(profile.id, { can_send_news: newVal })
  // Обновляем реактивно через Object.assign на элементе массива
  const idx = advertisers.value.findIndex(a => a.id === profile.id)
  if (idx !== -1) Object.assign(advertisers.value[idx], { can_send_news: newVal })
  if (selectedProfile.value?.id === profile.id) selectedProfile.value.can_send_news = newVal
}

function viewProfile(p) { selectedProfile.value = p }

async function openStatsModal(p) {
  statsTarget.value = p
  // Загружаем текущий конфиг
  await statsStore.fetchStatsConfig(p.id)
  const cfg = statsStore.config
  statsForm.enabled          = p.stats_enabled || false
  statsForm.data_source      = cfg?.data_source      || 'internal'
  statsForm.api_url          = cfg?.api_url          || ''
  statsForm.api_key          = cfg?.api_key          || ''
  statsForm.update_frequency = cfg?.update_frequency || 'daily'
}

async function saveStats() {
  if (!statsTarget.value) return
  savingStats.value = true
  try {
    // Обновляем флаг stats_enabled на профиле
    await pb.collection('profiles').update(statsTarget.value.id, { stats_enabled: statsForm.enabled })
    const idx = advertisers.value.findIndex(a => a.id === statsTarget.value.id)
    if (idx !== -1) Object.assign(advertisers.value[idx], { stats_enabled: statsForm.enabled })

    // Сохраняем конфиг статистики
    await statsStore.saveStatsConfig(statsTarget.value.id, {
      data_source:      statsForm.data_source,
      api_url:          statsForm.api_url,
      api_key:          statsForm.api_key,
      update_frequency: statsForm.update_frequency,
    })
    statsTarget.value = null
  } catch (e) {
    alert('Ошибка: ' + (e.message || 'Попробуйте ещё раз'))
  } finally {
    savingStats.value = false
  }
}

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  await fetchAdvertisers()
  loading.value = false
})
</script>

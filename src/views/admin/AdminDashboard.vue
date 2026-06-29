<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold mb-1">Панель администратора</h1>
    <p class="text-sm text-brand-gray-dark mb-6">ВсемЗапчасти.медиа</p>

    <!-- KPI -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="card text-center">
        <div class="text-3xl font-extrabold text-blue-600">{{ stats.pending }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Запросов на размещение</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-extrabold text-orange-500">{{ stats.payment_pending }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Ожидают оплаты</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-extrabold text-green-600">{{ stats.active }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Активных</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-extrabold text-brand-red" style="font-size:1.5rem">{{ fmtP(stats.revenue) }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Выручка (активные)</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Срочные события -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold flex items-center gap-2">
            🔔 Срочные события
            <span v-if="urgentEvents.length" class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
              {{ urgentEvents.length }}
            </span>
          </h2>
          <router-link to="/admin/events" class="btn-ghost text-xs">Все →</router-link>
        </div>
        <div v-if="urgentEvents.length === 0" class="py-4 text-center text-sm text-brand-gray-dark">Нет срочных событий 🎉</div>
        <div v-else class="space-y-2">
          <div v-for="ev in urgentEvents.slice(0,4)" :key="ev.id"
            class="flex items-start gap-3 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
            <span class="text-base flex-shrink-0 mt-0.5">{{ ev.icon }}</span>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-red-800">{{ ev.title }}</div>
              <div class="text-xs text-red-600 truncate">{{ ev.company }}</div>
            </div>
            <router-link :to="ev.link || '/admin/bookings'" class="text-xs text-red-700 font-semibold flex-shrink-0">→</router-link>
          </div>
        </div>
      </div>

      <!-- Новые запросы на размещение -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold">📋 Запросы на бронь</h2>
          <router-link to="/admin/bookings" class="btn-ghost text-xs">Все →</router-link>
        </div>
        <div v-if="loadingReq" class="py-4 text-center text-sm text-brand-gray-dark">Загрузка...</div>
        <div v-else-if="pendingRequests.length === 0" class="py-4 text-center text-sm text-brand-gray-dark">Нет новых запросов</div>
        <div v-else class="space-y-2">
          <div v-for="r in pendingRequests.slice(0,4)" :key="r.id"
            class="flex items-center justify-between gap-2 px-3 py-2 bg-brand-gray rounded-xl">
            <div class="min-w-0">
              <div class="text-sm font-semibold truncate">{{ r.profiles?.company_name }}</div>
              <div class="text-xs text-brand-gray-dark">{{ FORMAT_LABELS[r.format_type] }} · {{ r.duration_months }} мес.</div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-sm font-bold text-brand-red">{{ fmtP(r.total_price) }}</div>
              <router-link to="/admin/bookings" class="text-xs text-brand-red font-semibold">Открыть</router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Новости на модерации -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold">📰 Новости на модерации</h2>
          <router-link to="/admin/news" class="btn-ghost text-xs">Все →</router-link>
        </div>
        <div v-if="pendingNews.length === 0" class="py-4 text-center text-sm text-brand-gray-dark">Нет новостей на модерации</div>
        <div v-else class="space-y-2">
          <div v-for="n in pendingNews.slice(0,3)" :key="n.id"
            class="flex items-center justify-between gap-3 px-3 py-2.5 bg-brand-gray rounded-xl">
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">{{ n.title }}</div>
              <div class="text-xs text-brand-gray-dark">{{ n.expand?.advertiser_id?.company_name }}</div>
            </div>
            <router-link to="/admin/news" class="btn-primary text-xs flex-shrink-0">Просмотреть</router-link>
          </div>
        </div>
      </div>

      <!-- Загруженность слотов — быстрый обзор -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold">📊 Загруженность</h2>
          <router-link to="/admin/occupancy" class="btn-ghost text-xs">Детально →</router-link>
        </div>
        <div class="space-y-2">
          <div v-for="s in occupancySummary" :key="s.label" class="flex items-center gap-3">
            <div class="text-xs text-brand-gray-dark w-40 truncate">{{ s.label }}</div>
            <div class="flex-1 bg-brand-gray rounded-full h-2 overflow-hidden">
              <div class="h-full bg-brand-red rounded-full transition-all" :style="`width:${s.pct}%`"></div>
            </div>
            <div class="text-xs font-semibold w-12 text-right">{{ s.pct }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRequestsStore } from '@/stores/requests'
import { useSlotsStore }    from '@/stores/slots'
import { pb }               from '@/lib/pb'

const reqStore   = useRequestsStore()
const slotsStore = useSlotsStore()
const loadingReq = ref(true)
const pendingNews = ref([])

const FORMAT_LABELS = {
  sponsor_platform: 'Спонсор платформы', top10_suppliers: 'Топ-10 поставщиков',
  recommended_brands: 'Рекомендуемые бренды', banner: 'Баннер',
}

const pendingRequests = computed(() => reqStore.allRequests.filter(r => r.status === 'pending'))

const stats = computed(() => {
  const all = reqStore.allRequests
  return {
    pending:         all.filter(r => r.status === 'pending').length,
    payment_pending: all.filter(r => r.status === 'payment_pending').length,
    active:          all.filter(r => r.status === 'active').length,
    revenue:         all.filter(r => r.status === 'active').reduce((s, r) => s + (r.total_price || 0), 0),
  }
})

// Срочные события
const urgentEvents = computed(() => {
  const evs = []
  const all = reqStore.allRequests

  all.filter(r => r.status === 'pending').forEach(r => evs.push({
    id: 'p_'+r.id, icon: '📋', title: 'Новый запрос на размещение',
    company: r.profiles?.company_name || '—', link: '/admin/bookings',
  }))

  all.filter(r => r.status === 'payment_pending' && r.payment_due_date && new Date(r.payment_due_date) < new Date()).forEach(r => evs.push({
    id: 'od_'+r.id, icon: '⚠️', title: 'Просроченная оплата',
    company: r.profiles?.company_name || '—', link: '/admin/bookings',
  }))

  all.filter(r => r.status === 'active' && r.actual_end_date).forEach(r => {
    const d = Math.ceil((new Date(r.actual_end_date) - new Date()) / 86400000)
    if (d > 0 && d <= 7) evs.push({
      id: 'ex_'+r.id, icon: '⏰', title: `Заканчивается через ${d} дн.`,
      company: r.profiles?.company_name || '—', link: '/admin/bookings',
    })
  })

  pendingNews.value.slice(0,2).forEach(n => evs.push({
    id: 'n_'+n.id, icon: '📰', title: 'Новость на модерации',
    company: n.expand?.advertiser_id?.company_name || '—', link: '/admin/news',
  }))

  return evs
})

// Загруженность по форматам
const occupancySummary = computed(() => {
  const formats = [
    { key: 'sponsor_platform',   label: 'Спонсоры платформы' },
    { key: 'top10_suppliers',    label: 'Топ-10 поставщиков' },
    { key: 'recommended_brands', label: 'Рекомендуемые бренды' },
    { key: 'banner',             label: 'Баннеры' },
  ]
  return formats.map(f => {
    const slots = slotsStore.slots.filter(s => s.format_type === f.key)
    const occ   = slots.filter(s => s.is_occupied).length
    return { label: f.label, pct: slots.length ? Math.round(occ / slots.length * 100) : 0 }
  })
})

function fmtP(n) { return n ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽' : '0 ₽' }

onMounted(async () => {
  await Promise.all([reqStore.fetchAllRequests(), slotsStore.fetchSlots()])
  loadingReq.value = false
  try {
    const res = await pb.collection('advertiser_news').getList(1, 50, {
      filter: 'status = "submitted"', sort: '-submitted_at', expand: 'advertiser_id',
    })
    pendingNews.value = res.items
  } catch (e) { /* non-critical */ }
})
</script>

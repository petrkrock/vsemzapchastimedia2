<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-1">
      <h1 class="text-2xl font-extrabold">Лента событий</h1>
      <span v-if="urgent > 0" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        🔔 {{ urgent }} требуют внимания
      </span>
    </div>
    <p class="text-sm text-brand-gray-dark mb-5">Напоминания и события по всем рекламодателям</p>

    <!-- Категории -->
    <div class="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
      <button v-for="f in filters" :key="f.key" @click="activeFilter = f.key"
        class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
        :class="activeFilter === f.key ? 'bg-brand-red text-white' : 'bg-white text-brand-gray-dark border border-brand-gray-mid'"
      >{{ f.label }} <span class="opacity-60">({{ counts[f.key] }})</span></button>
    </div>

    <div v-if="loading" class="py-12 text-center text-brand-gray-dark">Загрузка...</div>
    <div v-else-if="filtered.length === 0" class="card py-10 text-center text-brand-gray-dark text-sm">
      Нет событий в этой категории 🎉
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="ev in filtered" :key="ev.id"
        class="card flex items-start gap-4"
        :class="ev.urgent ? 'border-l-4 border-l-brand-red' : ''"
      >
        <div class="text-2xl flex-shrink-0 mt-0.5">{{ ev.icon }}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="font-semibold text-sm">{{ ev.title }}</div>
              <div class="text-xs text-brand-gray-dark mt-0.5">{{ ev.company }}</div>
              <div class="text-xs text-brand-gray-dark mt-1">{{ ev.detail }}</div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <span :class="ev.urgent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'"
                class="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                {{ ev.dateLabel }}
              </span>
              <router-link v-if="ev.link" :to="ev.link" class="text-xs text-brand-red font-semibold hover:underline">
                Открыть →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRequestsStore } from '@/stores/requests'
import { pb } from '@/lib/pb'

const reqStore = useRequestsStore()
const loading  = ref(true)
const activeFilter = ref('all')
const pendingNews  = ref([])

const filters = [
  { key: 'all',       label: 'Все' },
  { key: 'urgent',    label: '🔴 Срочные' },
  { key: 'expiring',  label: '⏰ Истекают' },
  { key: 'bookings',  label: '📋 Бронирование' },
  { key: 'news',      label: '📰 Новости' },
  { key: 'payments',  label: '💳 Оплата' },
]

function daysUntil(d) {
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
}

function daysAgo(d) {
  return Math.ceil((new Date() - new Date(d)) / (1000 * 60 * 60 * 24))
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '–'
}

// Собираем все события
const allEvents = computed(() => {
  const evs = []
  const all = reqStore.allRequests

  // Новые запросы на размещение
  all.filter(r => r.status === 'pending').forEach(r => {
    evs.push({
      id:        'pending_' + r.id,
      icon:      '📋',
      category:  'bookings',
      title:     'Новый запрос на размещение',
      company:   r.profiles?.company_name || '—',
      detail:    `${FORMAT_LABELS[r.format_type]} · ${r.duration_months} мес. · ${fmtP(r.total_price)}`,
      dateLabel: daysAgo(r.created) === 0 ? 'Сегодня' : `${daysAgo(r.created)} дн. назад`,
      urgent:    daysAgo(r.created) >= 2,
      link:      '/admin/bookings',
    })
  })

  // Просроченные оплаты
  all.filter(r => r.status === 'payment_pending' && r.payment_due_date && new Date(r.payment_due_date) < new Date()).forEach(r => {
    evs.push({
      id:        'overdue_' + r.id,
      icon:      '⚠️',
      category:  'payments',
      title:     'Просроченная оплата',
      company:   r.profiles?.company_name || '—',
      detail:    `Счёт ${r.invoice_number} · срок до ${formatDate(r.payment_due_date)}`,
      dateLabel: `Просрочено ${Math.abs(daysUntil(r.payment_due_date))} дн.`,
      urgent:    true,
      link:      '/admin/bookings',
    })
  })

  // Ожидают оплаты (ещё не просрочено)
  all.filter(r => r.status === 'payment_pending' && r.payment_due_date && new Date(r.payment_due_date) >= new Date()).forEach(r => {
    const d = daysUntil(r.payment_due_date)
    evs.push({
      id:        'awaiting_' + r.id,
      icon:      '💳',
      category:  'payments',
      title:     'Ожидает оплаты',
      company:   r.profiles?.company_name || '—',
      detail:    `Счёт ${r.invoice_number} · оплатить до ${formatDate(r.payment_due_date)}`,
      dateLabel: d <= 3 ? `Осталось ${d} дн.` : `до ${formatDate(r.payment_due_date)}`,
      urgent:    d <= 3,
      link:      '/admin/bookings',
    })
  })

  // Заканчивающиеся размещения (≤ 30 дней)
  all.filter(r => r.status === 'active' && r.actual_end_date).forEach(r => {
    const d = daysUntil(r.actual_end_date)
    if (d > 0 && d <= 30) {
      evs.push({
        id:        'expiring_' + r.id,
        icon:      '⏰',
        category:  'expiring',
        title:     'Скоро заканчивается размещение',
        company:   r.profiles?.company_name || '—',
        detail:    `${FORMAT_LABELS[r.format_type]} · до ${formatDate(r.actual_end_date)}`,
        dateLabel: d <= 7 ? `${d} дн.` : `${formatDate(r.actual_end_date)}`,
        urgent:    d <= 7,
        link:      '/admin/bookings',
      })
    }
    // Истёкшие без завершения
    if (d <= 0 && d >= -7) {
      evs.push({
        id:        'expired_' + r.id,
        icon:      '🔴',
        category:  'expiring',
        title:     'Размещение истекло — требует завершения',
        company:   r.profiles?.company_name || '—',
        detail:    `${FORMAT_LABELS[r.format_type]} · истекло ${formatDate(r.actual_end_date)}`,
        dateLabel: 'Истекло',
        urgent:    true,
        link:      '/admin/bookings',
      })
    }
  })

  // Запросы на продление
  all.filter(r => r.renewal_requested && r.status === 'active').forEach(r => {
    evs.push({
      id:        'renewal_' + r.id,
      icon:      '🔄',
      category:  'bookings',
      title:     'Запрос на продление',
      company:   r.profiles?.company_name || '—',
      detail:    `${FORMAT_LABELS[r.format_type]} · до ${formatDate(r.actual_end_date)}`,
      dateLabel: formatDate(r.updated || r.created),
      urgent:    false,
      link:      '/admin/bookings',
    })
  })

  // Новости на модерации
  pendingNews.value.forEach(n => {
    evs.push({
      id:        'news_' + n.id,
      icon:      '📰',
      category:  'news',
      title:     'Новость ожидает модерации',
      company:   n.expand?.advertiser_id?.company_name || '—',
      detail:    n.title,
      dateLabel: daysAgo(n.submitted_at) === 0 ? 'Сегодня' : `${daysAgo(n.submitted_at)} дн. назад`,
      urgent:    daysAgo(n.submitted_at) >= 3,
      link:      '/admin/news',
    })
  })

  // Сортируем: сначала срочные, потом по дате (новые первыми)
  return evs.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0))
})

const urgent = computed(() => allEvents.value.filter(e => e.urgent).length)

const counts = computed(() => ({
  all:      allEvents.value.length,
  urgent:   allEvents.value.filter(e => e.urgent).length,
  expiring: allEvents.value.filter(e => e.category === 'expiring').length,
  bookings: allEvents.value.filter(e => e.category === 'bookings').length,
  news:     allEvents.value.filter(e => e.category === 'news').length,
  payments: allEvents.value.filter(e => e.category === 'payments').length,
}))

const filtered = computed(() => {
  if (activeFilter.value === 'all')    return allEvents.value
  if (activeFilter.value === 'urgent') return allEvents.value.filter(e => e.urgent)
  return allEvents.value.filter(e => e.category === activeFilter.value)
})

const FORMAT_LABELS = {
  sponsor_platform: 'Спонсор платформы', top10_suppliers: 'Топ-10 поставщиков',
  recommended_brands: 'Рекомендуемые бренды', banner: 'Баннер',
}
function fmtP(n) { return n ? new Intl.NumberFormat('ru-RU').format(n) + ' ₽' : '–' }

onMounted(async () => {
  await reqStore.fetchAllRequests()
  try {
    const res = await pb.collection('advertiser_news').getList(1, 100, {
      filter: 'status = "submitted"', sort: '-submitted_at', expand: 'advertiser_id',
    })
    pendingNews.value = res.items
  } catch (e) { /* non-critical */ }
  loading.value = false
})
</script>

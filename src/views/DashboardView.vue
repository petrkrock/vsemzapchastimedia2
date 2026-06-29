<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Welcome -->
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-brand-black">
        👋 Здравствуйте, {{ auth.profile?.company_name || auth.profile?.brand_name || 'Рекламодатель' }}
      </h1>
      <p class="text-sm text-brand-gray-dark mt-1">Рекламный кабинет ВсемЗапчасти.медиа</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="card text-center">
        <div class="text-3xl font-extrabold text-brand-red">{{ stats.active }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Активных</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-extrabold text-yellow-500">{{ stats.pending }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Запросы на размещение</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-extrabold text-blue-500">{{ stats.paid }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Ожидают оплаты</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-extrabold text-brand-black">{{ stats.total }}</div>
        <div class="text-xs text-brand-gray-dark mt-1">Всего заявок</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Active placements -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-brand-black">Мои размещения</h2>
          <router-link to="/my-requests" class="btn-ghost text-xs">Все заявки →</router-link>
        </div>

        <div v-if="loadingReq" class="py-6 text-center text-brand-gray-dark text-sm">Загрузка...</div>
        <div v-else-if="activeRequests.length === 0" class="py-6 text-center">
          <div class="text-3xl mb-2">📋</div>
          <p class="text-sm text-brand-gray-dark">Нет активных размещений</p>
          <router-link to="/ad-formats" class="btn-primary mt-3 inline-block">Выбрать формат</router-link>
        </div>
        <div v-else class="space-y-2">
          <div v-for="r in activeRequests.slice(0,3)" :key="r.id" class="px-3 py-2 bg-brand-gray rounded-xl">
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="text-sm font-semibold truncate">{{ FORMAT_LABELS[r.format_type] }}</div>
                <div class="text-xs text-brand-gray-dark">{{ r.duration_months }} мес. · {{ formatPrice(r.total_price) }}</div>
              </div>
              <span :class="`badge-${r.status}`">{{ STATUS_LABELS[r.status] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="card">
        <h2 class="font-bold text-brand-black mb-3">Быстрые действия</h2>
        <div class="space-y-2">
          <router-link to="/ad-formats" class="flex items-center gap-3 px-4 py-3 bg-brand-gray rounded-xl hover:bg-red-50 hover:border-brand-red border border-transparent transition-colors group">
            <span class="text-xl">📢</span>
            <div>
              <div class="text-sm font-semibold group-hover:text-brand-red">Забронировать рекламу</div>
              <div class="text-xs text-brand-gray-dark">Выбрать формат и слот</div>
            </div>
          </router-link>
          <router-link to="/my-requests" class="flex items-center gap-3 px-4 py-3 bg-brand-gray rounded-xl hover:bg-red-50 border border-transparent hover:border-brand-red transition-colors group">
            <span class="text-xl">📄</span>
            <div>
              <div class="text-sm font-semibold group-hover:text-brand-red">Мои заявки и счета</div>
              <div class="text-xs text-brand-gray-dark">Статусы, оплата, продление</div>
            </div>
          </router-link>
          <router-link v-if="auth.canSendNews" to="/news" class="flex items-center gap-3 px-4 py-3 bg-brand-gray rounded-xl hover:bg-red-50 border border-transparent hover:border-brand-red transition-colors group">
            <span class="text-xl">📰</span>
            <div>
              <div class="text-sm font-semibold group-hover:text-brand-red">Разместить новость</div>
              <div class="text-xs text-brand-gray-dark">Отправить материал на модерацию</div>
            </div>
          </router-link>
          <router-link v-if="auth.hasActiveStats" to="/statistics" class="flex items-center gap-3 px-4 py-3 bg-brand-gray rounded-xl hover:bg-red-50 border border-transparent hover:border-brand-red transition-colors group">
            <span class="text-xl">📊</span>
            <div>
              <div class="text-sm font-semibold group-hover:text-brand-red">Статистика показов</div>
              <div class="text-xs text-brand-gray-dark">Сколько клиентов увидели рекламу</div>
            </div>
          </router-link>
          <div v-if="!auth.canSendNews" class="flex items-center gap-3 px-4 py-3 bg-brand-gray rounded-xl opacity-60">
            <span class="text-xl">🔒</span>
            <div>
              <div class="text-sm font-semibold">Публикация новостей</div>
              <div class="text-xs text-brand-gray-dark">Доступно для спонсоров платформы</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile completeness hint -->
    <div v-if="!profileComplete" class="mt-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
      <span class="text-yellow-500 text-xl">⚠️</span>
      <div>
        <p class="text-sm font-semibold text-yellow-800">Заполните профиль компании</p>
        <p class="text-xs text-yellow-700">Некоторые данные отсутствуют — это может задержать обработку заявок.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'

const auth    = useAuthStore()
const reqStore = useRequestsStore()
const loadingReq = ref(true)

const FORMAT_LABELS = {
  sponsor_platform:   'Спонсор платформы',
  top10_suppliers:    'Топ-10 поставщиков',
  recommended_brands: 'Рекомендуемые бренды',
  banner:             'Баннер',
}
const STATUS_LABELS = {
  pending:         'Запрос на размещение',
  approved:        'Одобрено',
  rejected:        'Отклонено',
  payment_pending: 'Ожидает оплаты',
  paid:            'Оплачено',
  active:          'Активно',
  completed:       'Завершено',
  cancelled:       'Отменено',
}

const activeRequests = computed(() =>
  reqStore.requests.filter(r => ['active', 'approved', 'payment_pending'].includes(r.status))
)
const stats = computed(() => ({
  active:  reqStore.requests.filter(r => r.status === 'active').length,
  pending: reqStore.requests.filter(r => r.status === 'pending').length,
  paid:    reqStore.requests.filter(r => r.status === 'payment_pending').length,
  total:   reqStore.requests.length,
}))
const profileComplete = computed(() =>
  auth.profile?.company_name && auth.profile?.inn && auth.profile?.phone && auth.profile?.contact_person
)

function formatPrice(n) {
  if (!n) return '–'
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'
}

onMounted(async () => {
  if (auth.profile?.id) await reqStore.fetchMyRequests(auth.profile.id)
  loadingReq.value = false
})
</script>

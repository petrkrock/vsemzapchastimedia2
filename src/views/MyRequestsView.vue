<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold text-brand-black mb-1">Мои заявки</h1>
    <p class="text-sm text-brand-gray-dark mb-5">История размещений, счета и статусы</p>

    <div class="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
      <button v-for="f in filters" :key="f.key" @click="activeFilter = f.key"
        class="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors"
        :class="activeFilter === f.key ? 'bg-brand-red text-white' : 'bg-white text-brand-gray-dark hover:text-brand-black'"
      >
        {{ f.label }} <span class="ml-1 opacity-70">({{ counts[f.key] }})</span>
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-brand-gray-dark">Загрузка...</div>

    <div v-else-if="filtered.length === 0" class="py-12 text-center card">
      <div class="text-4xl mb-3">📋</div>
      <p class="text-brand-gray-dark text-sm">Заявок нет</p>
      <router-link to="/ad-formats" class="btn-primary mt-4 inline-block">Подать заявку</router-link>
    </div>

    <div v-else class="space-y-3">
      <div v-if="dueSoonRequests.length > 0" class="px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
        <span class="text-orange-500 text-xl">⏰</span>
        <div>
          <p class="text-sm font-semibold text-orange-800">Размещение заканчивается скоро</p>
          <p class="text-xs text-orange-700">Доступна кнопка «Продлить» — не упустите место!</p>
        </div>
      </div>

      <div v-for="r in filtered" :key="r.id" class="card">
        <div class="flex flex-col sm:flex-row sm:items-start gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold text-brand-black">{{ FORMAT_LABELS[r.format_type] }}</span>
              <span v-if="r.slot_number" class="text-xs text-brand-gray-dark">слот №{{ r.slot_number }}</span>
              <span :class="`badge-${r.status}`">{{ STATUS_LABELS[r.status] }}</span>
              <span v-if="r.is_paid" class="badge-paid">✓ Оплачено</span>
            </div>
            <p class="text-xs text-brand-gray-dark mt-1.5">
              {{ r.duration_months }} мес.
              · <strong>{{ formatPrice(r.total_price) }}</strong>
              <span v-if="r.discount_applied > 0"> · скидка {{ r.discount_applied }}%</span>
            </p>
            <div v-if="r.actual_start_date" class="text-xs text-brand-gray-dark mt-1">
              📅 {{ formatDate(r.actual_start_date) }} — {{ formatDate(r.actual_end_date) }}
              <span v-if="reqStore.isDueSoon(r)" class="text-orange-600 font-semibold ml-2">⚠ скоро заканчивается</span>
            </div>
            <div v-if="r.invoice_number" class="mt-2 px-3 py-2 bg-brand-gray rounded-lg">
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>📄 Счёт: <strong>{{ r.invoice_number }}</strong></span>
                <span v-if="r.invoice_date">от {{ formatDate(r.invoice_date) }}</span>
                <span v-if="r.payment_due_date" :class="isOverdue(r) ? 'text-red-600 font-semibold' : ''">
                  оплатить до {{ formatDate(r.payment_due_date) }}
                  <span v-if="isOverdue(r)"> ⚠ просрочено</span>
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-2 sm:flex-col sm:items-end">
            <button
              v-if="reqStore.isDueSoon(r) && !r.renewal_requested && r.status === 'active'"
              @click="renew(r)"
              class="btn-primary text-xs"
            >🔄 Продлить</button>
            <span v-if="r.renewal_requested" class="badge-submitted text-xs">Запрос на продление</span>
          </div>
        </div>

        <div v-if="r.admin_notes" class="mt-3 px-3 py-2 bg-gray-50 border border-brand-gray-mid rounded-lg text-xs text-brand-gray-dark">
          💬 <span class="font-medium">Примечание:</span> {{ r.admin_notes }}
        </div>
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
const loading  = ref(true)
const activeFilter = ref('all')

const FORMAT_LABELS = {
  sponsor_platform:   'Спонсор платформы',
  top10_suppliers:    'Топ-10 поставщиков',
  recommended_brands: 'Рекомендуемые бренды',
  banner:             'Баннер',
}
const STATUS_LABELS = {
  pending: 'Запрос на размещение', approved: 'Одобрено', rejected: 'Отклонено',
  payment_pending: 'Ожидает оплаты', paid: 'Оплачено', active: 'Активно',
  completed: 'Завершено', cancelled: 'Отменено',
}

const filters = [
  { key: 'all',             label: 'Все' },
  { key: 'active',          label: 'Активные' },
  { key: 'pending', label: 'Запрос на размещение' },
  { key: 'payment_pending', label: 'Ожидают оплаты' },
  { key: 'completed',       label: 'Завершённые' },
]

const counts = computed(() => {
  const all = reqStore.requests
  return {
    all:             all.length,
    active:          all.filter(r => r.status === 'active').length,
    pending:         all.filter(r => r.status === 'pending').length,
    payment_pending: all.filter(r => r.status === 'payment_pending').length,
    completed:       all.filter(r => ['completed', 'cancelled', 'rejected'].includes(r.status)).length,
  }
})

const filtered = computed(() => {
  if (activeFilter.value === 'all') return reqStore.requests
  if (activeFilter.value === 'completed') return reqStore.requests.filter(r => ['completed', 'cancelled', 'rejected'].includes(r.status))
  return reqStore.requests.filter(r => r.status === activeFilter.value)
})

const dueSoonRequests = computed(() => reqStore.requests.filter(r => reqStore.isDueSoon(r)))

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatPrice(n) {
  if (!n) return '–'
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'
}
function isOverdue(r) {
  if (!r.payment_due_date) return false
  return new Date(r.payment_due_date) < new Date() && !r.is_paid
}

async function renew(r) {
  await reqStore.requestRenewal(r.id)
  if (auth.profile?.id) await reqStore.fetchMyRequests(auth.profile.id)
}

onMounted(async () => {
  if (auth.profile?.id) await reqStore.fetchMyRequests(auth.profile.id)
  loading.value = false
})
</script>

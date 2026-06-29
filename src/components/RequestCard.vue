<template>
  <div class="card">
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-semibold text-brand-black">{{ formatTypeLabel }}</span>
          <span v-if="request.slot_number">слот №{{ request.slot_number }}</span>
          <component :is="'span'" :class="badgeClass">{{ statusLabel }}</component>
        </div>
        <p class="text-xs text-brand-gray-dark mt-1">
          {{ request.duration_months }} мес. · {{ formatPrice(request.total_price) }}
          <span v-if="request.discount_applied"> · скидка {{ request.discount_applied }}%</span>
        </p>
      </div>
      <div class="text-right flex-shrink-0">
        <div v-if="request.actual_start_date" class="text-xs text-brand-gray-dark">
          {{ formatDate(request.actual_start_date) }} — {{ formatDate(request.actual_end_date) }}
        </div>
        <div v-if="request.invoice_number" class="text-xs text-brand-gray-dark mt-0.5">
          Счёт: {{ request.invoice_number }}
        </div>
      </div>
    </div>

    <div v-if="request.admin_notes" class="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-brand-gray-dark">
      💬 {{ request.admin_notes }}
    </div>

    <div class="mt-3 flex gap-2 flex-wrap">
      <button
        v-if="isDueSoon && !request.renewal_requested && request.status === 'active'"
        @click="$emit('renew', request)"
        class="btn-primary text-xs"
      >
        🔄 Продлить
      </button>
      <span v-if="request.renewal_requested" class="badge-submitted">Запрос на продление</span>
      <span v-if="request.is_paid" class="badge-paid">✓ Оплачено</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRequestsStore } from '@/stores/requests'

const props = defineProps({ request: Object })
defineEmits(['renew'])

const reqStore = useRequestsStore()
const isDueSoon = computed(() => reqStore.isDueSoon(props.request))

const FORMAT_LABELS = {
  sponsor_platform: 'Спонсор платформы',
  top10_suppliers: 'Топ-10 поставщиков',
  recommended_brands: 'Рекомендуемые бренды',
  banner: 'Баннер',
}
const STATUS_LABELS = {
  pending: 'Запрос на размещение',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  payment_pending: 'Ожидает оплаты',
  paid: 'Оплачено',
  active: 'Активно',
  completed: 'Завершено',
  cancelled: 'Отменено',
}

const formatTypeLabel = computed(() => FORMAT_LABELS[props.request.format_type] || props.request.format_type)
const statusLabel = computed(() => STATUS_LABELS[props.request.status] || props.request.status)
const badgeClass = computed(() => `badge-${props.request.status}`)

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatPrice(n) {
  if (!n) return '–'
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'
}
</script>

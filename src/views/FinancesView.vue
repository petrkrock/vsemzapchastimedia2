<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold mb-1">Финансы</h1>
    <p class="text-sm text-brand-gray-dark mb-5">Счета, договоры и акты по вашим размещениям</p>

    <div class="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
      <button v-for="f in filters" :key="f.key" @click="activeFilter = f.key"
        class="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors"
        :class="activeFilter === f.key ? 'bg-brand-red text-white' : 'bg-white text-brand-gray-dark border border-brand-gray-mid'"
      >{{ f.label }} <span class="ml-1 opacity-70">({{ counts[f.key] }})</span></button>
    </div>

    <div v-if="loading" class="py-12 text-center text-brand-gray-dark">Загрузка...</div>

    <div v-else-if="filtered.length === 0" class="card py-12 text-center">
      <div class="text-4xl mb-3">💳</div>
      <p class="text-sm text-brand-gray-dark">Документов нет</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="inv in filtered" :key="inv.id" class="card">
        <div class="flex flex-col sm:flex-row sm:items-start gap-3">
          <div class="flex-1 min-w-0">
            <!-- Статус + номер -->
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="text-lg">📄</span>
              <span class="font-bold">{{ inv.invoice_number }}</span>
              <span :class="invoiceStatusClass(inv)">{{ invoiceStatusLabel(inv) }}</span>
            </div>

            <!-- Детали -->
            <div class="text-xs text-brand-gray-dark space-y-0.5">
              <div>Формат: <span class="text-brand-black font-medium">{{ FORMAT_LABELS[inv.format_type] }}</span>
                <span v-if="inv.slot_number"> · Слот №{{ inv.slot_number }}</span>
              </div>
              <div>Срок: <span class="text-brand-black">{{ inv.duration_months }} мес.</span></div>
              <div class="flex flex-wrap gap-x-4 mt-1">
                <span>Дата счёта: <strong>{{ fmtDate(inv.invoice_date) }}</strong></span>
                <span v-if="inv.payment_due_date"
                  :class="isOverdue(inv) ? 'text-red-600 font-semibold' : ''">
                  Оплатить до: <strong>{{ fmtDate(inv.payment_due_date) }}</strong>
                  <span v-if="isOverdue(inv)"> ⚠</span>
                </span>
              </div>
              <div v-if="inv.actual_start_date">
                Период: {{ fmtDate(inv.actual_start_date) }} — {{ fmtDate(inv.actual_end_date) }}
              </div>
            </div>
          </div>

          <!-- Сумма -->
          <div class="flex flex-col items-end gap-2 flex-shrink-0">
            <div class="text-xl font-extrabold text-brand-red">{{ fmtPrice(inv.total_price) }}</div>
          </div>
        </div>

        <!-- Документы для скачивания -->
        <div class="mt-4 pt-3 border-t border-brand-gray-mid">
          <div class="text-xs text-brand-gray-dark font-semibold uppercase tracking-wide mb-2">Документы</div>
          <div class="flex flex-wrap gap-2">
            <button v-if="inv.invoice_file" @click="download(inv, 'invoice_file', inv.invoice_number || 'Счёт')"
              class="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              ⬇ Скачать счёт
            </button>
            <span v-else class="text-xs text-brand-gray-dark italic px-3 py-1.5 bg-brand-gray rounded-lg">Счёт не прикреплён</span>

            <button v-if="inv.contract_file" @click="download(inv, 'contract_file', 'Договор')"
              class="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
              ⬇ Договор
            </button>
            <span v-else class="text-xs text-brand-gray-dark italic px-3 py-1.5 bg-brand-gray rounded-lg">Договор не прикреплён</span>

            <button v-if="inv.completion_act_file" @click="download(inv, 'completion_act_file', 'Акт')"
              class="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
              ⬇ Акт выполненных работ
            </button>
            <span v-else-if="inv.status === 'completed'" class="text-xs text-brand-gray-dark italic px-3 py-1.5 bg-brand-gray rounded-lg">
              Акт не прикреплён
            </span>
          </div>
        </div>

        <div v-if="inv.admin_notes" class="mt-3 px-3 py-2 bg-gray-50 border border-brand-gray-mid rounded-lg text-xs text-brand-gray-dark">
          💬 {{ inv.admin_notes }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore }    from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { pb }               from '@/lib/pb'

const auth     = useAuthStore()
const reqStore = useRequestsStore()
const loading  = ref(true)
const activeFilter = ref('all')

const FORMAT_LABELS = {
  sponsor_platform:   'Спонсор платформы',
  top10_suppliers:    'Топ-10 поставщиков',
  recommended_brands: 'Рекомендуемые бренды',
  banner:             'Баннер',
}

const filters = [
  { key: 'all',      label: 'Все' },
  { key: 'awaiting', label: 'Ожидает оплаты' },
  { key: 'paid',     label: 'Оплачены' },
  { key: 'void',     label: 'Аннулированы' },
]

// Только заявки с выставленным счётом
const invoices = computed(() =>
  reqStore.requests.filter(r => r.invoice_number)
)

const counts = computed(() => ({
  all:      invoices.value.length,
  awaiting: invoices.value.filter(r => r.status === 'payment_pending').length,
  paid:     invoices.value.filter(r => r.is_paid || ['paid', 'active', 'completed'].includes(r.status)).length,
  void:     invoices.value.filter(r => r.status === 'cancelled').length,
}))

const filtered = computed(() => {
  if (activeFilter.value === 'all')      return invoices.value
  if (activeFilter.value === 'awaiting') return invoices.value.filter(r => r.status === 'payment_pending')
  if (activeFilter.value === 'paid')     return invoices.value.filter(r => r.is_paid || ['paid', 'active', 'completed'].includes(r.status))
  if (activeFilter.value === 'void')     return invoices.value.filter(r => r.status === 'cancelled')
  return invoices.value
})

function invoiceStatusLabel(inv) {
  if (inv.status === 'cancelled')                                               return 'Аннулирован'
  if (inv.status === 'completed')                                               return 'Завершено'
  if (inv.is_paid || inv.status === 'paid' || inv.status === 'active')         return 'Оплачен'
  if (inv.status === 'payment_pending')                                         return 'Ожидает оплаты'
  return 'Выставлен'
}

function invoiceStatusClass(inv) {
  if (inv.status === 'cancelled')                                               return 'badge badge-cancelled'
  if (inv.status === 'completed')                                               return 'badge badge-active'
  if (inv.is_paid || inv.status === 'paid' || inv.status === 'active')         return 'badge badge-paid'
  if (inv.status === 'payment_pending')                                         return 'badge badge-payment_pending'
  return 'badge badge-approved'
}

function isOverdue(inv) {
  if (!inv.payment_due_date || inv.is_paid) return false
  return new Date(inv.payment_due_date) < new Date()
}

function download(record, field, name) {
  if (!record[field]) return
  const url = pb.files.getUrl(record, record[field])
  const a = document.createElement('a')
  a.href = url; a.download = name + '.pdf'; a.target = '_blank'; a.click()
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'
}
function fmtPrice(n) {
  return n ? new Intl.NumberFormat('ru-RU').format(n) + ' ₽' : '–'
}

onMounted(async () => {
  if (auth.profile?.id) await reqStore.fetchMyRequests(auth.profile.id)
  loading.value = false
})
</script>

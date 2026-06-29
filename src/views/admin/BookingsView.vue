<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold mb-1">Бронирование</h1>
    <p class="text-sm text-brand-gray-dark mb-5">Запросы на размещение от рекламодателей</p>

    <!-- Фильтры -->
    <div class="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
      <button v-for="f in filters" :key="f.key" @click="activeFilter = f.key"
        class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
        :class="activeFilter === f.key ? 'bg-brand-red text-white' : 'bg-white text-brand-gray-dark border border-brand-gray-mid'"
      >{{ f.label }} <span class="opacity-60">({{ counts[f.key] }})</span></button>
    </div>

    <div v-if="loading" class="py-12 text-center text-brand-gray-dark">Загрузка...</div>
    <div v-else-if="filtered.length === 0" class="card py-10 text-center text-brand-gray-dark text-sm">
      Нет запросов в этой категории
    </div>

    <div v-else class="space-y-3">
      <div v-for="r in filtered" :key="r.id" class="card">
        <!-- Заголовок -->
        <div class="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="font-bold text-brand-black text-base">{{ r.profiles?.company_name }}</span>
              <span :class="`badge-${r.status}`">{{ STATUS_LABELS[r.status] }}</span>
              <span v-if="r.renewal_requested" class="badge-submitted">🔄 Продление</span>
            </div>
            <div class="text-xs text-brand-gray-dark space-y-0.5">
              <div>{{ r.profiles?.email }} · {{ r.profiles?.phone }}</div>
              <div>{{ r.profiles?.inn ? `ИНН: ${r.profiles.inn}` : '' }}</div>
            </div>
          </div>
          <div class="text-xs text-brand-gray-dark shrink-0">{{ formatDate(r.created) }}</div>
        </div>

        <!-- Детали бронирования -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div class="px-3 py-2.5 bg-brand-gray rounded-xl">
            <div class="text-[10px] text-brand-gray-dark font-semibold uppercase tracking-wide mb-1">Формат</div>
            <div class="text-sm font-semibold">{{ FORMAT_LABELS[r.format_type] }}</div>
            <div v-if="r.slot_number" class="text-xs text-brand-gray-dark">Слот №{{ r.slot_number }}</div>
          </div>
          <div class="px-3 py-2.5 bg-brand-gray rounded-xl">
            <div class="text-[10px] text-brand-gray-dark font-semibold uppercase tracking-wide mb-1">Срок и сумма</div>
            <div class="text-sm font-semibold">{{ r.duration_months }} мес.</div>
            <div class="text-sm font-bold text-brand-red">{{ formatPrice(r.total_price) }}</div>
            <div v-if="r.discount_applied > 0" class="text-xs text-green-700">скидка {{ r.discount_applied }}%</div>
          </div>
          <div class="px-3 py-2.5 bg-brand-gray rounded-xl">
            <div class="text-[10px] text-brand-gray-dark font-semibold uppercase tracking-wide mb-1">Период размещения</div>
            <div v-if="r.actual_start_date" class="text-sm font-semibold">
              {{ formatDate(r.actual_start_date) }} — {{ formatDate(r.actual_end_date) }}
            </div>
            <div v-else class="text-sm text-brand-gray-dark italic">Дата будет согласована</div>
          </div>
        </div>

        <!-- Счёт и документы -->
        <div v-if="r.invoice_number" class="mb-4 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span class="font-semibold text-blue-800">📄 {{ r.invoice_number }}</span>
            <span>от {{ formatDate(r.invoice_date) }}</span>
            <span v-if="r.payment_due_date" :class="isOverdue(r) ? 'text-red-600 font-semibold' : ''">
              до {{ formatDate(r.payment_due_date) }}<span v-if="isOverdue(r)"> ⚠</span>
            </span>
            <span v-if="r.is_paid" class="text-green-700 font-semibold">✓ Оплачено {{ formatDate(r.paid_at) }}</span>
          </div>
          <div class="flex gap-3 mt-2 flex-wrap">
            <button v-if="r.invoice_file" @click="download(r, 'invoice_file', r.invoice_number)" class="btn-ghost text-xs flex items-center gap-1">⬇ Счёт</button>
            <button v-if="r.contract_file" @click="download(r, 'contract_file', 'Договор')" class="btn-ghost text-xs flex items-center gap-1">⬇ Договор</button>
            <button v-if="r.completion_act_file" @click="download(r, 'completion_act_file', 'Акт')" class="btn-ghost text-xs flex items-center gap-1">⬇ Акт</button>
          </div>
        </div>

        <div v-if="r.admin_notes" class="mb-3 px-3 py-2 bg-gray-50 rounded-lg text-xs text-brand-gray-dark">
          💬 {{ r.admin_notes }}
        </div>

        <!-- Действия -->
        <div class="flex flex-wrap gap-2 pt-3 border-t border-brand-gray-mid">
          <template v-if="r.status === 'pending'">
            <button @click="invoiceRequest = r" class="btn-primary text-xs">📄 Выставить счёт</button>
            <button @click="reject(r)" class="btn-secondary text-xs text-red-600 border-red-200">✕ Отклонить</button>
          </template>
          <template v-if="r.status === 'payment_pending'">
            <button @click="markPaid(r)" class="btn-primary text-xs">💰 Отметить оплату</button>
            <button @click="invoiceRequest = r" class="btn-secondary text-xs">📄 Пересоздать счёт</button>
          </template>
          <template v-if="r.status === 'paid'">
            <button @click="activate(r)" class="btn-primary text-xs">▶ Активировать</button>
          </template>
          <template v-if="r.status === 'active'">
            <button @click="completeRequest = r" class="btn-secondary text-xs">✓ Завершить размещение</button>
          </template>
          <button @click="openNotes(r)" class="btn-secondary text-xs">💬 Примечание</button>
        </div>
      </div>
    </div>

    <!-- Модалка счёт + договор -->
    <InvoiceForm v-if="invoiceRequest" :request="invoiceRequest" @close="invoiceRequest = null" @success="onDone" />

    <!-- Модалка завершения + акт -->
    <div v-if="completeRequest" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="completeRequest = null">
      <div class="bg-white rounded-2xl p-5 w-full max-w-md">
        <h2 class="font-bold text-lg mb-1">Завершить размещение</h2>
        <p class="text-sm text-brand-gray-dark mb-4">{{ completeRequest.profiles?.company_name }} · {{ FORMAT_LABELS[completeRequest.format_type] }}</p>
        <FileUpload label="Акт выполненных работ (PDF)" v-model="actFile" />
        <div class="flex gap-2 mt-4">
          <button @click="completeRequest = null" class="btn-secondary flex-1 text-xs">Отмена</button>
          <button @click="completeWithAct" :disabled="savingAct" class="btn-primary flex-1 text-xs">
            <span v-if="savingAct" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 inline-block"></span>
            Завершить
          </button>
        </div>
      </div>
    </div>

    <!-- Модалка примечания -->
    <div v-if="notesRequest" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="notesRequest = null">
      <div class="bg-white rounded-2xl p-5 w-full max-w-sm">
        <h2 class="font-bold mb-3">Примечание</h2>
        <textarea v-model="notesText" class="input resize-none" rows="4" placeholder="Введите примечание..."></textarea>
        <div class="flex gap-2 mt-3">
          <button @click="saveNotes" class="btn-primary flex-1 text-xs">Сохранить</button>
          <button @click="notesRequest = null" class="btn-secondary flex-1 text-xs">Отмена</button>
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
import InvoiceForm          from '@/components/InvoiceForm.vue'
import FileUpload           from '@/components/FileUpload.vue'

const reqStore   = useRequestsStore()
const slotsStore = useSlotsStore()

const loading         = ref(true)
const activeFilter    = ref('pending')
const invoiceRequest  = ref(null)
const completeRequest = ref(null)
const actFile         = ref(null)
const savingAct       = ref(false)
const notesRequest    = ref(null)
const notesText       = ref('')

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

const filters = [
  { key: 'pending',         label: 'Новые запросы' },
  { key: 'payment_pending', label: 'Ожидают оплаты' },
  { key: 'active',          label: 'Активные' },
  { key: 'completed',       label: 'Завершённые' },
  { key: 'all',             label: 'Все' },
]

const counts = computed(() => {
  const all = reqStore.allRequests
  return {
    pending:         all.filter(r => r.status === 'pending').length,
    payment_pending: all.filter(r => r.status === 'payment_pending').length,
    active:          all.filter(r => r.status === 'active').length,
    completed:       all.filter(r => ['completed','cancelled','rejected'].includes(r.status)).length,
    all:             all.length,
  }
})

const filtered = computed(() => {
  if (activeFilter.value === 'all') return reqStore.allRequests
  if (activeFilter.value === 'completed') return reqStore.allRequests.filter(r => ['completed','cancelled','rejected'].includes(r.status))
  return reqStore.allRequests.filter(r => r.status === activeFilter.value)
})

async function reject(r) {
  if (!confirm('Отклонить запрос?')) return
  await reqStore.updateRequest(r.id, { status: 'rejected' })
  await reqStore.fetchAllRequests()
}

async function markPaid(r) {
  await reqStore.updateRequest(r.id, { status: 'paid', is_paid: true, paid_at: new Date().toISOString() })
  await reqStore.fetchAllRequests()
}

async function activate(r) {
  await reqStore.updateRequest(r.id, { status: 'active' })
  if (r.assigned_slot_id) {
    await pb.collection('ad_slots').update(r.assigned_slot_id, {
      is_occupied: true, current_advertiser_id: r.advertiser_id,
    })
  }
  await reqStore.fetchAllRequests()
}

async function completeWithAct() {
  if (!completeRequest.value) return
  savingAct.value = true
  try {
    const fd = new FormData()
    fd.append('status', 'completed')
    if (actFile.value) fd.append('completion_act_file', actFile.value)
    await pb.collection('placement_requests').update(completeRequest.value.id, fd)

    if (completeRequest.value.assigned_slot_id) {
      await pb.collection('ad_slots').update(completeRequest.value.assigned_slot_id, {
        is_occupied: false, current_advertiser_id: null,
      })
    }
    completeRequest.value = null
    actFile.value = null
    await reqStore.fetchAllRequests()
  } catch (e) {
    alert('Ошибка: ' + (e.message || 'Попробуйте ещё раз'))
  } finally {
    savingAct.value = false
  }
}

function openNotes(r) { notesRequest.value = r; notesText.value = r.admin_notes || '' }
async function saveNotes() {
  await reqStore.updateRequest(notesRequest.value.id, { admin_notes: notesText.value })
  notesRequest.value = null
  await reqStore.fetchAllRequests()
}

async function onDone() {
  invoiceRequest.value = null
  await reqStore.fetchAllRequests()
  await slotsStore.fetchSlots()
}

function download(record, field, name) {
  const url = pb.files.getUrl(record, record[field])
  const a = document.createElement('a'); a.href = url; a.download = name + '.pdf'; a.target = '_blank'; a.click()
}

function isOverdue(r) {
  return r.payment_due_date && !r.is_paid && new Date(r.payment_due_date) < new Date()
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'
}
function formatPrice(n) {
  return n ? new Intl.NumberFormat('ru-RU').format(n) + ' ₽' : '–'
}

onMounted(async () => {
  await Promise.all([reqStore.fetchAllRequests(), slotsStore.fetchSlots()])
  loading.value = false
})
</script>

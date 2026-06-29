<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
    <div class="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-brand-black text-lg">Создать счёт</h2>
        <button @click="$emit('close')" class="text-brand-gray-dark text-xl leading-none">×</button>
      </div>

      <div class="mb-4 px-3 py-2 bg-brand-gray rounded-lg text-sm">
        <p class="font-medium">{{ companyName }}</p>
        <p class="text-brand-gray-dark text-xs mt-0.5">{{ formatTypeLabel }} · {{ request?.duration_months }} мес. · {{ formatPrice(request?.total_price) }}</p>
      </div>

      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Номер счёта</label>
            <input v-model="form.invoice_number" class="input" placeholder="INV-2026-001" />
          </div>
          <div>
            <label class="label">Дата счёта</label>
            <input type="date" v-model="form.invoice_date" class="input" />
          </div>
        </div>

        <div>
          <label class="label">Оплатить до</label>
          <input type="date" v-model="form.payment_due_date" class="input" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Дата начала размещения</label>
            <input type="date" v-model="form.actual_start_date" class="input" @change="calcEndDate" />
          </div>
          <div>
            <label class="label">Дата окончания</label>
            <input type="date" v-model="form.actual_end_date" class="input" />
          </div>
        </div>

        <div>
          <label class="label">Назначить слот</label>
          <select v-model="form.assigned_slot_id" class="input">
            <option value="">Выберите слот</option>
            <option v-for="s in availableSlots" :key="s.id" :value="s.id">Слот №{{ s.slot_number }}</option>
          </select>
        </div>

        <!-- Файл счёта -->
        <FileUpload label="Счёт (PDF)" accept=".pdf,application/pdf" v-model="invoiceFile" :existing="request?.invoice_file ? getFileUrl(request, 'invoice_file') : null" />

        <!-- Договор -->
        <FileUpload label="Договор (PDF)" accept=".pdf,application/pdf" v-model="contractFile" :existing="request?.contract_file ? getFileUrl(request, 'contract_file') : null" />

        <div>
          <label class="label">Примечание</label>
          <textarea v-model="form.admin_notes" class="input resize-none" rows="2" placeholder="Необязательно"></textarea>
        </div>

        <div class="px-4 py-3 bg-brand-gray rounded-xl flex justify-between text-sm font-bold">
          <span>Сумма к оплате</span>
          <span class="text-brand-red">{{ formatPrice(request?.total_price) }}</span>
        </div>

        <button @click="submit" :disabled="loading" class="btn-primary w-full flex justify-center">
          <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
          Выставить счёт и одобрить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSlotsStore } from '@/stores/slots'
import { pb } from '@/lib/pb'
import FileUpload from './FileUpload.vue'

const props = defineProps({ request: Object })
const emit  = defineEmits(['close', 'success'])

const slotsStore  = useSlotsStore()
const loading     = ref(false)
const invoiceFile = ref(null)
const contractFile = ref(null)

const today = new Date().toISOString().split('T')[0]
const form  = ref({
  invoice_number:    `INV-${new Date().getFullYear()}-`,
  invoice_date:      today,
  payment_due_date:  '',
  actual_start_date: '',
  actual_end_date:   '',
  assigned_slot_id:  '',
  admin_notes:       '',
})

const FORMAT_LABELS = {
  sponsor_platform:   'Спонсор платформы',
  top10_suppliers:    'Топ-10 поставщиков',
  recommended_brands: 'Рекомендуемые бренды',
  banner:             'Баннер',
}

const companyName    = computed(() => props.request?.profiles?.company_name || props.request?.expand?.advertiser_id?.company_name || '')
const formatTypeLabel = computed(() => FORMAT_LABELS[props.request?.format_type] || props.request?.format_type)
const availableSlots  = computed(() => slotsStore.slots.filter(s => s.format_type === props.request?.format_type && !s.is_occupied))

function getFileUrl(record, field) {
  return pb.files.getUrl(record, record[field])
}

function calcEndDate() {
  if (form.value.actual_start_date && props.request?.duration_months) {
    const d = new Date(form.value.actual_start_date)
    d.setMonth(d.getMonth() + props.request.duration_months)
    form.value.actual_end_date = d.toISOString().split('T')[0]
  }
}

function formatPrice(n) {
  return n ? new Intl.NumberFormat('ru-RU').format(n) + ' ₽' : '–'
}

onMounted(() => {
  calcEndDate()
  const d = new Date()
  d.setDate(d.getDate() + 5)
  form.value.payment_due_date = d.toISOString().split('T')[0]
})

async function submit() {
  loading.value = true
  try {
    const fd = new FormData()
    fd.append('status',           'payment_pending')
    fd.append('invoice_number',   form.value.invoice_number)
    fd.append('invoice_date',     form.value.invoice_date)
    fd.append('payment_due_date', form.value.payment_due_date)
    if (form.value.actual_start_date) fd.append('actual_start_date', form.value.actual_start_date)
    if (form.value.actual_end_date)   fd.append('actual_end_date',   form.value.actual_end_date)
    if (form.value.assigned_slot_id)  fd.append('assigned_slot_id',  form.value.assigned_slot_id)
    if (form.value.admin_notes)       fd.append('admin_notes',       form.value.admin_notes)
    if (invoiceFile.value)            fd.append('invoice_file',      invoiceFile.value)
    if (contractFile.value)           fd.append('contract_file',     contractFile.value)

    await pb.collection('placement_requests').update(props.request.id, fd)

    if (form.value.assigned_slot_id) {
      await pb.collection('ad_slots').update(form.value.assigned_slot_id, {
        is_occupied:           true,
        occupied_from:         form.value.actual_start_date,
        occupied_until:        form.value.actual_end_date,
        current_advertiser_id: props.request.advertiser_id,
      })
    }
    emit('success')
  } catch (e) {
    alert('Ошибка: ' + (e.message || 'Попробуйте ещё раз'))
  } finally {
    loading.value = false
  }
}
</script>

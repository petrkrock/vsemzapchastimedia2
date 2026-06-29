<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
    <div class="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-brand-black text-lg">Запрос на размещение</h2>
        <button @click="$emit('close')" class="text-brand-gray-dark hover:text-brand-black text-xl leading-none">×</button>
      </div>

      <div v-if="slot" class="mb-4 px-3 py-2 bg-brand-gray rounded-lg">
        <p class="text-sm font-medium text-brand-black">{{ formatTypeLabel }} — слот №{{ slot.slot_number }}</p>
        <p class="text-xs text-brand-gray-dark mt-0.5">{{ formatPrice(pricing?.base_price_monthly) }}/мес</p>
        <p v-if="slot && slotsStore.getSlotStatus(slot) === 'releasing'" class="text-xs text-yellow-700 mt-1 font-medium">
          🟡 Слот освобождается — размещение начнётся после завершения текущего
        </p>
      </div>

      <div class="space-y-4">
        <!-- Выбор срока -->
        <div>
          <label class="label">Срок размещения</label>
          <div v-if="availableDurations.length" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="m in availableDurations"
              :key="m"
              @click="months = m"
              class="py-2.5 rounded-lg text-sm font-semibold border transition-colors"
              :class="months === m
                ? 'bg-brand-red text-white border-brand-red'
                : 'bg-white text-brand-black border-brand-gray-mid hover:border-brand-red'"
            >
              {{ m }} мес.
              <div v-if="getMonthDiscount(m) > 0" class="text-[10px] opacity-80 mt-0.5">−{{ getMonthDiscount(m) }}%</div>
            </button>
          </div>
          <p v-else class="text-xs text-brand-gray-dark">Сроки не настроены — обратитесь к администратору</p>
        </div>

        <!-- Итого -->
        <div class="px-4 py-3 bg-brand-gray rounded-xl space-y-1.5">
          <div class="flex justify-between text-sm">
            <span class="text-brand-gray-dark">Стоимость без скидки</span>
            <span>{{ formatPrice((pricing?.base_price_monthly || 0) * (months || 0)) }}</span>
          </div>
          <div v-if="discount > 0" class="flex justify-between text-sm text-green-700">
            <span>Скидка {{ discount }}%</span>
            <span>−{{ formatPrice((pricing?.base_price_monthly || 0) * (months || 0) * discount / 100) }}</span>
          </div>
          <div class="flex justify-between text-sm font-bold text-brand-black border-t border-brand-gray-mid pt-1.5 mt-1.5">
            <span>Итого</span>
            <span class="text-brand-red">{{ formatPrice(totalPrice) }}</span>
          </div>
        </div>

        <div v-if="pricing?.bonus_description" class="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
          <span>🎁</span>
          <span class="text-xs text-brand-red font-medium">{{ pricing.bonus_description }}</span>
        </div>

        <p class="text-xs text-brand-gray-dark">
          После отправки запроса администратор рассмотрит его и выставит счёт. Дату начала размещения согласуем при оформлении.
        </p>

        <button @click="submit" :disabled="loading || !months" class="btn-primary w-full justify-center flex">
          <span v-if="loading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
          Отправить запрос на размещение
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSlotsStore } from '@/stores/slots'
import { useRequestsStore } from '@/stores/requests'

const props = defineProps({ slot: Object, formatType: String })
const emit  = defineEmits(['close', 'success'])

const auth       = useAuthStore()
const slotsStore = useSlotsStore()
const reqStore   = useRequestsStore()

const months  = ref(null)
const loading = ref(false)

const pricing            = computed(() => slotsStore.getPricing(props.formatType))
const availableDurations = computed(() => slotsStore.getAvailableDurations(props.formatType))

function getMonthDiscount(m) {
  if (!pricing.value) return 0
  return slotsStore.getDiscount(pricing.value, m)
}
const discount = computed(() => {
  if (!pricing.value || !months.value) return 0
  return slotsStore.getDiscount(pricing.value, months.value)
})
const totalPrice = computed(() => {
  if (!pricing.value || !months.value) return 0
  return pricing.value.base_price_monthly * months.value * (1 - discount.value / 100)
})

const FORMAT_LABELS = {
  sponsor_platform:   'Спонсор платформы',
  top10_suppliers:    'Топ-10 поставщиков',
  recommended_brands: 'Рекомендуемые бренды',
  banner:             'Баннер',
}
const formatTypeLabel = computed(() => FORMAT_LABELS[props.formatType] || props.formatType)

function formatPrice(n) {
  if (!n) return '0 ₽'
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽'
}

async function submit() {
  if (!months.value) return
  loading.value = true
  try {
    await reqStore.createRequest({
      advertiser_id:   auth.profile.id,
      format_type:     props.formatType,
      slot_number:     props.slot?.slot_number || null,
      duration_months: months.value,
      total_price:     totalPrice.value,
      discount_applied: discount.value,
      status:          'pending',
    })
    emit('success')
  } catch (e) {
    alert('Ошибка: ' + (e.message || 'Попробуйте ещё раз'))
  } finally {
    loading.value = false
  }
}
</script>

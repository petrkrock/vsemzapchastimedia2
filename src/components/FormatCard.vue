<!-- Карточка формата без сетки слотов — только статистика и бронь -->
<template>
  <div class="card">
    <!-- Заголовок -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <h3 class="font-bold text-brand-black">{{ title }}</h3>
        <p class="text-xs text-brand-gray-dark mt-0.5">{{ subtitle }}</p>
      </div>
      <div class="text-right flex-shrink-0 ml-4">
        <div class="text-sm font-bold text-brand-red">{{ fmtPrice(pricing?.base_price_monthly) }}/мес</div>
        <div class="text-[10px] text-brand-gray-dark mt-0.5">
          {{ availableDurations.join(', ') }} мес.
        </div>
      </div>
    </div>

    <!-- Скидки -->
    <div v-if="discountBadges.length" class="flex gap-2 flex-wrap mb-4">
      <span
        v-for="d in discountBadges" :key="d.months"
        class="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium"
      >−{{ d.discount }}% от {{ d.months }} мес.</span>
    </div>

    <!-- Бонус -->
    <div v-if="pricing?.bonus_description" class="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
      <span class="text-brand-red">🎁</span>
      <span class="text-xs text-brand-red font-medium">{{ pricing.bonus_description }}</span>
    </div>

    <!-- Статистика: цифры -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div class="text-center px-3 py-2.5 bg-brand-gray rounded-xl">
        <div class="text-2xl font-extrabold text-brand-black">{{ stats.total }}</div>
        <div class="text-[10px] text-brand-gray-dark mt-0.5 font-medium">Всего мест</div>
      </div>
      <div class="text-center px-3 py-2.5 bg-green-50 rounded-xl border border-green-100">
        <div class="text-2xl font-extrabold text-green-700">{{ stats.free }}</div>
        <div class="text-[10px] text-green-600 mt-0.5 font-medium">🟢 Свободно</div>
      </div>
      <div class="text-center px-3 py-2.5 bg-red-50 rounded-xl border border-red-100">
        <div class="text-2xl font-extrabold text-red-600">{{ stats.occupied }}</div>
        <div class="text-[10px] text-red-500 mt-0.5 font-medium">🔴 Занято</div>
      </div>
      <div class="text-center px-3 py-2.5 rounded-xl"
        :class="stats.releasing > 0 ? 'bg-yellow-50 border border-yellow-100' : 'bg-brand-gray'">
        <div class="text-2xl font-extrabold" :class="stats.releasing > 0 ? 'text-yellow-700' : 'text-brand-gray-dark'">
          {{ stats.releasing }}
        </div>
        <div class="text-[10px] mt-0.5 font-medium" :class="stats.releasing > 0 ? 'text-yellow-600' : 'text-brand-gray-dark'">
          🟡 Освобождается
        </div>
      </div>
    </div>

    <!-- Бронь на следующий период -->
    <div v-if="stats.booked > 0 || bookedNext" class="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
      <div class="flex items-start gap-2">
        <span class="text-blue-600 text-base flex-shrink-0 mt-0.5">🔵</span>
        <div>
          <div class="text-sm font-semibold text-blue-800">
            {{ stats.booked }} место{{ stats.booked > 1 ? 'а' : '' }} забронировано на следующий период
          </div>
          <div v-if="bookedNext?.actual_start_date" class="text-xs text-blue-600 mt-0.5">
            Размещение с {{ fmtDate(bookedNext.actual_start_date) }}
            <span v-if="bookedNext.actual_end_date"> по {{ fmtDate(bookedNext.actual_end_date) }}</span>
          </div>
          <div class="text-xs text-blue-600 mt-1">
            Бронь на следующий период доступна — обратитесь к менеджеру
          </div>
        </div>
      </div>
    </div>

    <!-- Кнопка -->
    <div class="flex items-center justify-between pt-3 border-t border-brand-gray-mid">
      <div class="text-xs text-brand-gray-dark">
        <span v-if="stats.free > 0">{{ stats.free }} свободных места из {{ stats.total }}</span>
        <span v-else-if="stats.releasing > 0">Освобождается {{ stats.releasing }} место</span>
        <span v-else class="text-brand-gray-dark">Все места заняты — бронь на следующий период</span>
      </div>
      <button @click="$emit('book')" class="btn-primary text-sm">
        Отправить запрос
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSlotsStore } from '@/stores/slots'

const props = defineProps({
  title:      String,
  subtitle:   String,
  formatType: String,
  stats:      Object,   // { total, free, occupied, releasing, booked }
  bookedNext: Object,   // заявка на следующий период или null
  pricing:    Object,
})
defineEmits(['book'])

const slotsStore = useSlotsStore()

const availableDurations = computed(() => slotsStore.getAvailableDurations(props.formatType))

const discountBadges = computed(() => {
  const d = props.pricing?.duration_discounts
  if (!Array.isArray(d)) return []
  return d.filter(x => x.discount > 0).sort((a, b) => a.months - b.months)
})

function fmtPrice(n) {
  if (!n) return '–'
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'
}

function fmtDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

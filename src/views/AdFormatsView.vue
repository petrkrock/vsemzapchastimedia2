<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold text-brand-black mb-1">Рекламные форматы</h1>
    <p class="text-sm text-brand-gray-dark mb-6">Выберите формат и отправьте запрос на размещение</p>

    <div v-if="loading" class="py-16 text-center text-brand-gray-dark">Загрузка...</div>

    <div v-else class="space-y-4">

      <!-- Форматы без выбора слота: Спонсоры, Топ-10, Рекомендуемые бренды -->
      <FormatCard
        v-for="fmt in mainFormats"
        :key="fmt.key"
        :title="fmt.title"
        :subtitle="fmt.subtitle"
        :format-type="fmt.key"
        :stats="getFormatStats(fmt.key)"
        :booked-next="getBookedNext(fmt.key)"
        :pricing="slotsStore.getPricing(fmt.key)"
        @book="openBooking(fmt.key)"
      />

      <!-- Баннеры — выбор конкретного баннера -->
      <div class="card">
        <div class="flex items-center justify-between mb-1">
          <h3 class="font-semibold text-brand-black">🖼 Рекламные баннеры</h3>
          <div class="text-sm font-bold text-brand-red">
            от {{ formatPrice(slotsStore.getPricing('banner')?.base_price_monthly) }}/мес
          </div>
        </div>
        <p class="text-xs text-brand-gray-dark mb-4">Выберите баннер и отправьте запрос</p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div
            v-for="slot in bannerSlots"
            :key="slot.id"
            class="border-2 rounded-xl p-4 cursor-pointer transition-all"
            :class="getBannerCardClass(slot)"
            @click="selectBanner(slot)"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="font-bold text-sm">Баннер {{ slot.slot_number }}</div>
              <span class="text-xl">{{ getBannerIcon(slot) }}</span>
            </div>

            <!-- Текущий статус -->
            <div class="text-xs mb-2">
              <span v-if="slotStatus(slot) === 'free'" class="text-green-700 font-semibold">Свободно</span>
              <span v-else-if="slotStatus(slot) === 'releasing'" class="text-yellow-700 font-semibold">
                Освобождается {{ formatDate(slot.occupied_until) }}
              </span>
              <span v-else class="text-red-600 font-semibold">
                Занято до {{ formatDate(slot.occupied_until) }}
              </span>
            </div>

            <!-- Бронь на следующий период -->
            <div v-if="getBannerBookedNext(slot)" class="px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mb-2">
              <div class="text-[10px] text-blue-800 font-bold mb-0.5">🔵 Забронировано</div>
              <div class="text-[10px] text-blue-600">
                с {{ formatDate(getBannerBookedNext(slot).actual_start_date) }}
                по {{ formatDate(getBannerBookedNext(slot).actual_end_date) }}
              </div>
            </div>

            <div class="text-sm font-bold text-brand-red">{{ formatPrice(getBannerPrice(slot)) }}/мес</div>

            <div v-if="selectedBanner?.id === slot.id"
              class="mt-2 text-center text-xs font-bold text-brand-red bg-red-50 rounded-lg py-1">
              ✓ Выбран
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-brand-gray-mid">
          <div class="text-xs text-brand-gray-dark">
            <span v-if="selectedBanner">Выбран: <strong>Баннер {{ selectedBanner.slot_number }}</strong></span>
            <span v-else class="italic">Выберите баннер выше</span>
          </div>
          <button
            @click="openBannerBooking"
            :disabled="!selectedBanner"
            class="btn-primary text-sm"
            :class="!selectedBanner ? 'opacity-40 cursor-not-allowed' : ''"
          >Отправить запрос</button>
        </div>
      </div>

    </div>

    <!-- Легенда -->
    <div class="mt-4 flex flex-wrap gap-4 text-xs text-brand-gray-dark">
      <span>🟢 Свободно</span>
      <span>🟡 Освобождается в течение 30 дней</span>
      <span>🔴 Занято</span>
      <span>🔵 Забронировано на следующий период</span>
    </div>

    <!-- Форма запроса -->
    <BookingForm
      v-if="showBooking"
      :format-type="selectedFormat"
      :slot="selectedSlot"
      @close="showBooking = false"
      @success="onBookingSuccess"
    />

    <!-- Toast -->
    <div v-if="toastVisible"
      class="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg z-50">
      ✅ Запрос отправлен! Ожидайте рассмотрения.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSlotsStore }    from '@/stores/slots'
import { useRequestsStore } from '@/stores/requests'
import { useAuthStore }     from '@/stores/auth'
import FormatCard  from '@/components/FormatCard.vue'
import BookingForm from '@/components/BookingForm.vue'

const slotsStore = useSlotsStore()
const reqStore   = useRequestsStore()
const auth       = useAuthStore()

const loading        = ref(true)
const showBooking    = ref(false)
const toastVisible   = ref(false)
const selectedFormat = ref(null)
const selectedSlot   = ref(null)
const selectedBanner = ref(null)

const mainFormats = [
  { key: 'sponsor_platform',   title: '⭐ Спонсоры платформы',   subtitle: 'Логотип + ссылка на главной странице платформы' },
  { key: 'top10_suppliers',    title: '🏆 Топ-10 поставщиков',   subtitle: 'Позиция в рейтинге поставщиков' },
  { key: 'recommended_brands', title: '🥇 Рекомендуемые бренды', subtitle: 'Позиция в разделе рекомендуемых брендов · 30 мест' },
]

const bannerSlots = computed(() =>
  slotsStore.getSlotsByFormat('banner').sort((a, b) => a.slot_number - b.slot_number)
)

// ─── Статистика формата (цифры) ───────────────────────────────────────
function getFormatStats(formatType) {
  const slots = slotsStore.getSlotsByFormat(formatType)
  return {
    total:     slots.length,
    free:      slots.filter(s => slotsStore.getSlotStatus(s) === 'free').length,
    occupied:  slots.filter(s => slotsStore.getSlotStatus(s) === 'occupied').length,
    releasing: slots.filter(s => slotsStore.getSlotStatus(s) === 'releasing').length,
    booked:    countBooked(formatType),
  }
}

// Забронировано на следующий период = заявка со счётом и датой начала в будущем
function countBooked(formatType) {
  return reqStore.requests.filter(r =>
    r.format_type === formatType &&
    ['payment_pending', 'paid'].includes(r.status) &&
    r.actual_start_date &&
    new Date(r.actual_start_date) > new Date()
  ).length
}

function getBookedNext(formatType) {
  return reqStore.requests.find(r =>
    r.format_type === formatType &&
    ['payment_pending', 'paid'].includes(r.status) &&
    r.actual_start_date &&
    new Date(r.actual_start_date) > new Date()
  ) || null
}

function getBannerBookedNext(slot) {
  return reqStore.requests.find(r =>
    r.format_type === 'banner' &&
    (r.assigned_slot_id === slot.id || r.slot_number === slot.slot_number) &&
    ['payment_pending', 'paid'].includes(r.status) &&
    r.actual_start_date &&
    new Date(r.actual_start_date) > new Date()
  ) || null
}

// ─── Действия ─────────────────────────────────────────────────────────
function openBooking(formatType) {
  selectedFormat.value = formatType
  selectedSlot.value   = null
  showBooking.value    = true
}

function selectBanner(slot) {
  selectedBanner.value = selectedBanner.value?.id === slot.id ? null : slot
}

function openBannerBooking() {
  if (!selectedBanner.value) return
  selectedFormat.value = 'banner'
  selectedSlot.value   = selectedBanner.value
  showBooking.value    = true
}

function onBookingSuccess() {
  showBooking.value    = false
  selectedBanner.value = null
  toastVisible.value   = true
  setTimeout(() => toastVisible.value = false, 4000)
  slotsStore.fetchSlots()
}

// ─── Баннер визуал ────────────────────────────────────────────────────
function slotStatus(slot) { return slotsStore.getSlotStatus(slot) }

function getBannerCardClass(slot) {
  const isSelected = selectedBanner.value?.id === slot.id
  if (isSelected) return 'border-brand-red bg-red-50 ring-2 ring-brand-red/20'
  const s = slotStatus(slot)
  if (s === 'free')      return 'border-green-200 bg-green-50 hover:border-brand-red hover:bg-red-50'
  if (s === 'releasing') return 'border-yellow-200 bg-yellow-50 hover:border-brand-red'
  return 'border-red-100 bg-red-50 hover:border-brand-red'
}

function getBannerIcon(slot) {
  if (selectedBanner.value?.id === slot.id) return '✅'
  const s = slotStatus(slot)
  if (s === 'free')      return '🟢'
  if (s === 'releasing') return '🟡'
  return '🔴'
}

function getBannerPrice(slot) {
  const p = slotsStore.getPricing(`banner_${slot.slot_number}`) || slotsStore.getPricing('banner')
  return p?.base_price_monthly || 0
}

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' })
}
function formatPrice(n) {
  if (!n) return '–'
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'
}

onMounted(async () => {
  await Promise.all([
    slotsStore.fetchSlots(),
    slotsStore.fetchPricing(),
    auth.profile?.id ? reqStore.fetchMyRequests(auth.profile.id) : Promise.resolve(),
  ])
  loading.value = false
})
</script>

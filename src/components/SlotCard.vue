<template>
  <div
    class="relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-150 select-none"
    :class="[statusClasses, selected ? 'ring-2 ring-brand-red ring-offset-1' : '']"
    @click="$emit('click', slot)"
  >
    <div class="flex items-start justify-between gap-1">
      <div>
        <div class="flex items-center gap-1.5">
          <span class="text-base leading-none">{{ statusIcon }}</span>
          <span class="text-xs font-semibold text-brand-black">№{{ slot.slot_number }}</span>
        </div>
        <p class="text-[10px] text-brand-gray-dark mt-1 leading-tight">{{ statusLabel }}</p>
        <p v-if="slot.is_occupied && slot.occupied_until" class="text-[10px] text-brand-gray-dark">
          до {{ formatDate(slot.occupied_until) }}
        </p>
      </div>
      <div v-if="selected" class="w-4 h-4 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
        <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
          <path d="M10 3L5 8.5 2 5.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </div>
    </div>
    <div v-if="slot.expand?.current_advertiser_id?.brand_name || slot.expand?.current_advertiser_id?.company_name" class="mt-1.5 text-[10px] font-medium text-brand-gray-dark truncate">
      {{ slot.expand?.current_advertiser_id?.brand_name || slot.expand?.current_advertiser_id?.company_name }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSlotsStore } from '@/stores/slots'

const props = defineProps({
  slot: Object,
  selected: Boolean,
})
defineEmits(['click'])

const slotsStore = useSlotsStore()
const status = computed(() => slotsStore.getSlotStatus(props.slot))

const statusIcon = computed(() => ({ free: '🟢', occupied: '🔴', releasing: '🟡' }[status.value]))
const statusLabel = computed(() => ({ free: 'Свободно', occupied: 'Занято', releasing: 'Освобождается' }[status.value]))

const statusClasses = computed(() => ({
  free: 'border-green-200 bg-green-50 hover:border-green-400',
  occupied: 'border-red-200 bg-red-50 cursor-not-allowed opacity-70',
  releasing: 'border-yellow-200 bg-yellow-50 hover:border-yellow-400',
}[status.value]))

function formatDate(d) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

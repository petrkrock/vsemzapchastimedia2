<!-- Переиспользуемый компонент загрузки файла (PDF/изображение) -->
<template>
  <div>
    <label class="label">{{ label }}</label>
    <div
      class="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors"
      :class="modelValue ? 'border-green-400 bg-green-50' : 'border-brand-gray-mid hover:border-brand-red'"
      @click="$refs.inp.click()"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <div v-if="!modelValue && !existing">
        <div class="text-2xl mb-1">📎</div>
        <p class="text-sm text-brand-gray-dark">Нажмите или перетащите файл</p>
        <p class="text-xs text-brand-gray-dark mt-1">PDF, до 10 МБ</p>
      </div>
      <div v-else-if="modelValue" class="flex items-center justify-center gap-2 text-green-700 font-medium text-sm">
        <span>✅</span> {{ modelValue.name }}
        <button @click.stop="$emit('update:modelValue', null)" class="text-red-400 hover:text-red-600 ml-2">✕</button>
      </div>
      <div v-else class="flex items-center justify-center gap-2 text-xs text-brand-gray-dark">
        <span>📄</span> Файл прикреплён
        <a :href="existing" target="_blank" class="text-brand-red font-semibold ml-2" @click.stop>Открыть</a>
        <button @click.stop="replaceMode = true" class="text-brand-gray-dark hover:text-brand-black ml-2 underline">Заменить</button>
      </div>
    </div>
    <input ref="inp" type="file" :accept="accept" class="hidden" @change="onFile" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
  label:      { type: String, default: 'Файл (PDF)' },
  accept:     { type: String, default: '.pdf,application/pdf' },
  modelValue: File,
  existing:   { type: String, default: null },
})
const emit = defineEmits(['update:modelValue'])
const replaceMode = ref(false)

function onFile(e) { emit('update:modelValue', e.target.files[0] || null) }
function onDrop(e) { emit('update:modelValue', e.dataTransfer.files[0] || null) }
</script>

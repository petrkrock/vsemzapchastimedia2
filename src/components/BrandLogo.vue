<template>
  <svg viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg" :class="className">
    <!-- Gear icon -->
    <g transform="translate(0, 4)">
      <circle cx="16" cy="16" r="5" stroke="#E8231A" stroke-width="2.5" fill="none"/>
      <path d="M16 2v3M16 27v3M2 16h3M27 16h3M5.5 5.5l2.1 2.1M22.4 22.4l2.1 2.1M5.5 26.5l2.1-2.1M22.4 9.6l2.1-2.1" stroke="#E8231A" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <!-- Text: ВсемЗапчасти -->
    <text x="38" y="25" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#1A1A1A">Всем</text>
    <text x="79" y="25" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#E8231A">Запчасти</text>
    <text x="38" y="37" font-family="Inter, sans-serif" font-size="9" font-weight="500" fill="#6B6B6B" letter-spacing="1">МЕДИА</text>
  </svg>
</template>

<script setup>
defineProps({ className: { type: String, default: 'h-9' } })
</script>

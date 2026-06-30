<template>
  <header class="bg-white border-b p-4">
    <div class="max-w-6xl mx-auto flex justify-between">
      <span class="font-bold">ВсемЗапчасти.медиа</span>
      <button @click="logout" class="text-brand-red">Выйти</button>
    </div>
  </header>
</template>
<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const logout = () => auth.logout()
</script>

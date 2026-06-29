<template>
  <div class="min-h-screen bg-brand-gray">
    <template v-if="!auth.loading">
      <template v-if="auth.user">
        <AppHeader />
        <main class="pb-20 md:pb-6">
          <router-view />
        </main>
        <MobileNav />
      </template>
      <template v-else>
        <router-view />
      </template>
    </template>
    <template v-else>
      <div class="min-h-screen flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <BrandLogo class="h-10" />
          <div class="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/AppHeader.vue'
import MobileNav from '@/components/MobileNav.vue'
import BrandLogo from '@/components/BrandLogo.vue'

const auth = useAuthStore()
</script>

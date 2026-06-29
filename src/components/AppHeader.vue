<template>
  <header class="bg-white border-b border-brand-gray-mid sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
      <router-link to="/">
        <BrandLogo class="h-8" />
      </router-link>

      <nav class="hidden md:flex items-center gap-1">
        <template v-if="auth.isAdmin">
          <router-link v-for="item in adminNav" :key="item.to" :to="item.to" class="nav-link">
            {{ item.label }}
            <span v-if="item.badge && urgentCount > 0"
              class="ml-1 bg-brand-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {{ urgentCount }}
            </span>
          </router-link>
        </template>
        <template v-else>
          <router-link v-for="item in advertiserNav" :key="item.to" :to="item.to" class="nav-link">{{ item.label }}</router-link>
          <router-link v-if="auth.hasActiveStats" to="/statistics" class="nav-link">Статистика</router-link>
        </template>
      </nav>

      <div class="flex items-center gap-3">
        <span class="hidden md:block text-sm text-brand-gray-dark truncate max-w-[160px]">
          {{ auth.profile?.company_name || auth.user?.email }}
        </span>
        <router-link v-if="!auth.isAdmin" to="/profile" class="btn-secondary text-xs px-3 py-1.5">Профиль</router-link>
        <button @click="handleLogout" class="btn-secondary text-xs px-3 py-1.5">Выйти</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore }    from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'
import { useRouter }       from 'vue-router'
import BrandLogo from './BrandLogo.vue'

const auth     = useAuthStore()
const reqStore = useRequestsStore()
const router   = useRouter()

// Счётчик срочных событий для бейджа
const urgentCount = computed(() => {
  const all = reqStore.allRequests
  let n = 0
  n += all.filter(r => r.status === 'pending').length
  n += all.filter(r => r.status === 'payment_pending' && r.payment_due_date && new Date(r.payment_due_date) < new Date()).length
  return n
})

const advertiserNav = [
  { to: '/dashboard',   label: 'Дашборд' },
  { to: '/ad-formats',  label: 'Форматы' },
  { to: '/my-requests', label: 'Мои заявки' },
  { to: '/finances',    label: 'Финансы' },
  { to: '/news',        label: 'Новости' },
]

const adminNav = [
  { to: '/admin',              label: 'Дашборд' },
  { to: '/admin/events',       label: 'События', badge: true },
  { to: '/admin/bookings',     label: 'Бронь' },
  { to: '/admin/advertisers',  label: 'Рекламодатели' },
  { to: '/admin/occupancy',    label: 'Загруженность' },
  { to: '/admin/pricing',      label: 'Цены' },
  { to: '/admin/news',         label: 'Новости' },
]

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-link {
  @apply text-sm font-medium text-brand-gray-dark px-3 py-1.5 rounded-lg hover:bg-brand-gray hover:text-brand-black transition-colors flex items-center;
}
.router-link-active.nav-link {
  @apply text-brand-red bg-red-50;
}
</style>

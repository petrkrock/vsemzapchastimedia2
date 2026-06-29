<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-gray-mid z-40">
    <div class="flex items-stretch overflow-x-auto">
      <template v-if="auth.isAdmin">
        <router-link v-for="item in adminNav" :key="item.to" :to="item.to" class="mobile-nav-item">
          <span class="relative text-lg">{{ item.icon }}
            <span v-if="item.badge && urgentCount > 0"
              class="absolute -top-1 -right-1 bg-brand-red text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {{ urgentCount > 9 ? '9+' : urgentCount }}
            </span>
          </span>
          <span class="text-[10px] mt-0.5">{{ item.label }}</span>
        </router-link>
      </template>
      <template v-else>
        <router-link v-for="item in advertiserNav" :key="item.to" :to="item.to" class="mobile-nav-item">
          <span class="text-lg">{{ item.icon }}</span>
          <span class="text-[10px] mt-0.5">{{ item.label }}</span>
        </router-link>
        <router-link v-if="auth.hasActiveStats" to="/statistics" class="mobile-nav-item">
          <span class="text-lg">📊</span>
          <span class="text-[10px] mt-0.5">Статистика</span>
        </router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore }    from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'

const auth     = useAuthStore()
const reqStore = useRequestsStore()

const urgentCount = computed(() => {
  const all = reqStore.allRequests
  let n = 0
  n += all.filter(r => r.status === 'pending').length
  n += all.filter(r => r.status === 'payment_pending' && r.payment_due_date && new Date(r.payment_due_date) < new Date()).length
  return n
})

const advertiserNav = [
  { to: '/dashboard',   label: 'Главная',  icon: '🏠' },
  { to: '/ad-formats',  label: 'Форматы',  icon: '📢' },
  { to: '/my-requests', label: 'Заявки',   icon: '📋' },
  { to: '/finances',    label: 'Финансы',  icon: '💳' },
  { to: '/news',        label: 'Новости',  icon: '📰' },
]

const adminNav = [
  { to: '/admin',             label: 'Главная',   icon: '🏠' },
  { to: '/admin/events',      label: 'События',   icon: '🔔', badge: true },
  { to: '/admin/bookings',    label: 'Бронь',     icon: '📋' },
  { to: '/admin/occupancy',   label: 'Слоты',     icon: '📊' },
  { to: '/admin/news',        label: 'Новости',   icon: '📰' },
]
</script>

<style scoped>
.mobile-nav-item {
  @apply flex-1 flex flex-col items-center justify-center py-2 text-brand-gray-dark transition-colors min-w-[52px];
}
.router-link-active.mobile-nav-item {
  @apply text-brand-red;
}
</style>

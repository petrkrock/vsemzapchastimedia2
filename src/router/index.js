import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/dashboard' },

  // ── гостевые ─────────────────────────────────────────────────────────
  { path: '/login',    component: () => import('@/views/LoginView.vue'),    meta: { guest: true } },
  { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },

  // ── рекламодатель ─────────────────────────────────────────────────────
  { path: '/dashboard',   component: () => import('@/views/DashboardView.vue'),   meta: { auth: true } },
  { path: '/ad-formats',  component: () => import('@/views/AdFormatsView.vue'),   meta: { auth: true } },
  { path: '/my-requests', component: () => import('@/views/MyRequestsView.vue'),  meta: { auth: true } },
  { path: '/finances',    component: () => import('@/views/FinancesView.vue'),    meta: { auth: true } },
  { path: '/news',        component: () => import('@/views/NewsView.vue'),         meta: { auth: true } },
  { path: '/statistics',  component: () => import('@/views/StatisticsView.vue'),  meta: { auth: true } },
  { path: '/profile',     component: () => import('@/views/ProfileView.vue'),     meta: { auth: true } },

  // ── администратор ─────────────────────────────────────────────────────
  { path: '/admin',               component: () => import('@/views/admin/AdminDashboard.vue'),  meta: { auth: true, admin: true } },
  { path: '/admin/bookings',      component: () => import('@/views/admin/BookingsView.vue'),    meta: { auth: true, admin: true } },
  { path: '/admin/events',        component: () => import('@/views/admin/EventsFeedView.vue'),  meta: { auth: true, admin: true } },
  { path: '/admin/advertisers',   component: () => import('@/views/admin/AdvertisersList.vue'), meta: { auth: true, admin: true } },
  { path: '/admin/occupancy',     component: () => import('@/views/admin/OccupancyView.vue'),   meta: { auth: true, admin: true } },
  { path: '/admin/pricing',       component: () => import('@/views/admin/PricingView.vue'),     meta: { auth: true, admin: true } },
  { path: '/admin/news',          component: () => import('@/views/admin/NewsModeration.vue'),  meta: { auth: true, admin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.loading) {
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (!auth.loading) { clearInterval(interval); resolve() }
      }, 50)
    })
  }
  if (to.meta.auth && !auth.user)     return '/login'
  if (to.meta.guest && auth.user)     return auth.isAdmin ? '/admin' : '/dashboard'
  if (to.meta.admin && !auth.isAdmin) return '/dashboard'
})

export default router

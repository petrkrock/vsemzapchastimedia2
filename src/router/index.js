import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: () => import('@/views/LoginView.vue') },
  { path: '/register', component: () => import('@/views/RegisterView.vue') },
  { path: '/dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/profile', component: () => import('@/views/ProfileView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

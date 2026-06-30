import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: { template: '<h1>Главная</h1>' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

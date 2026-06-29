<template>
  <div class="min-h-screen bg-brand-gray flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-3">
          <svg viewBox="0 0 44 44" fill="none" class="h-10 w-10">
            <circle cx="22" cy="22" r="7" stroke="#E8231A" stroke-width="3" fill="none"/>
            <path d="M22 6v4M22 34v4M6 22h4M34 22h4M9.5 9.5l2.8 2.8M31.7 31.7l2.8 2.8M9.5 34.5l2.8-2.8M31.7 12.3l2.8-2.8" stroke="#E8231A" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <div class="text-left">
            <div class="text-xl font-extrabold text-brand-black leading-none">Всем<span class="text-brand-red">Запчасти</span></div>
            <div class="text-[9px] font-semibold text-brand-gray-dark tracking-[2px] mt-0.5">МЕДИА</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-card p-6">
        <h1 class="text-xl font-extrabold text-brand-black mb-1">Вход в кабинет</h1>
        <p class="text-sm text-brand-gray-dark mb-6">Рекламная платформа ВсемЗапчасти.медиа</p>

        <div v-if="error" class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {{ error }}
        </div>

        <div class="space-y-4">
          <div>
            <label class="label">Email</label>
            <input v-model="email" type="email" class="input" placeholder="you@company.ru" @keydown.enter="login" />
          </div>
          <div>
            <label class="label">Пароль</label>
            <input v-model="password" type="password" class="input" placeholder="Ваш пароль" @keydown.enter="login" />
          </div>
          <button @click="login" :disabled="loading" class="btn-primary w-full flex justify-center items-center gap-2 py-3">
            <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ loading ? 'Входим...' : 'Войти' }}
          </button>
        </div>

        <p class="text-center text-sm text-brand-gray-dark mt-5">
          Нет кабинета?
          <router-link to="/register" class="text-brand-red font-semibold hover:underline">Зарегистрироваться</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function login() {
  if (!email.value || !password.value) return
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push(auth.isAdmin ? '/admin' : '/dashboard')
  } catch (e) {
    error.value = e?.data?.message?.includes('authenticate') || e?.message?.includes('authenticate') ? 'Неверный email или пароль' : (e?.data?.message || e?.message || 'Ошибка входа')
  } finally {
    loading.value = false
  }
}
</script>

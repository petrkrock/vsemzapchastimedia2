<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="bg-white p-8 rounded-xl shadow-card max-w-sm w-full">
      <h1 class="text-2xl font-bold mb-4">Вход</h1>
      <input v-model="email" placeholder="Email" class="input mb-3" />
      <input v-model="password" type="password" placeholder="Пароль" class="input mb-4" />
      <button @click="login" class="btn-primary w-full">Войти</button>
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
const login = async () => {
  await auth.login(email.value, password.value)
  router.push('/dashboard')
}
</script>

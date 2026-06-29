<template>
  <div class="min-h-screen bg-brand-gray flex items-center justify-center p-4">
    <div class="w-full max-w-lg">
      <div class="text-center mb-6">
        <div class="inline-flex items-center gap-3">
          <svg viewBox="0 0 44 44" fill="none" class="h-10 w-10">
            <circle cx="22" cy="22" r="7" stroke="#E8231A" stroke-width="3" fill="none"/>
            <path d="M22 6v4M22 34v4M6 22h4M34 22h4M9.5 9.5l2.8 2.8M31.7 31.7l2.8 2.8M9.5 34.5l2.8-2.8M31.7 12.3l2.8-2.8" stroke="#E8231A" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <div class="text-left">
            <div class="text-xl font-extrabold leading-none">Всем<span class="text-brand-red">Запчасти</span></div>
            <div class="text-[9px] font-semibold text-brand-gray-dark tracking-[2px] mt-0.5">МЕДИА</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-card p-6">
        <h1 class="text-xl font-extrabold mb-1">Регистрация рекламодателя</h1>
        <p class="text-sm text-brand-gray-dark mb-6">Создайте кабинет для размещения рекламы на платформе</p>

        <div v-if="error" class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{{ error }}</div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label">Название компании *</label>
            <input v-model="form.company_name" class="input" placeholder="ООО АвтоТехника" />
          </div>
          <div>
            <label class="label">Бренд / Торговая марка</label>
            <input v-model="form.brand_name" class="input" placeholder="AutoTech" />
          </div>
          <div>
            <label class="label">ИНН *</label>
            <input v-model="form.inn" class="input" placeholder="7700000000" maxlength="12" />
          </div>
          <div>
            <label class="label">Телефон *</label>
            <input v-model="form.phone" class="input" placeholder="+7 (999) 000-00-00" type="tel" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">ФИО ответственного *</label>
            <input v-model="form.contact_person" class="input" placeholder="Иванов Иван Иванович" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Тип рекламодателя *</label>
            <select v-model="form.advertiser_type" class="input">
              <option value="">Выберите тип</option>
              <option value="supplier">Поставщик / Склад</option>
              <option value="brand">Бренд / Производитель</option>
              <option value="other">Прочее</option>
            </select>
          </div>
          <div v-if="form.advertiser_type === 'other'" class="sm:col-span-2">
            <label class="label">Уточните тип *</label>
            <input v-model="form.advertiser_type_custom" class="input" placeholder="Опишите вашу деятельность" />
          </div>
          <div>
            <label class="label">Email *</label>
            <input v-model="form.email" class="input" placeholder="info@company.ru" type="email" />
          </div>
          <div>
            <label class="label">Пароль *</label>
            <input v-model="form.password" class="input" placeholder="Минимум 8 символов" type="password" />
          </div>
        </div>

        <button @click="register" :disabled="loading || !isValid" class="btn-primary w-full flex justify-center items-center gap-2 py-3 mt-6">
          <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ loading ? 'Создаём кабинет...' : 'Создать кабинет' }}
        </button>

        <p class="text-center text-sm text-brand-gray-dark mt-4">
          Уже есть кабинет?
          <router-link to="/login" class="text-brand-red font-semibold hover:underline">Войти</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()

const loading = ref(false)
const error   = ref('')

const form = ref({
  company_name:           '',
  brand_name:             '',
  inn:                    '',
  phone:                  '',
  contact_person:         '',
  advertiser_type:        '',
  advertiser_type_custom: '',
  email:                  '',
  password:               '',
})

const isValid = computed(() =>
  form.value.company_name &&
  form.value.inn &&
  form.value.phone &&
  form.value.contact_person &&
  form.value.advertiser_type &&
  form.value.email &&
  form.value.password.length >= 8 &&
  (form.value.advertiser_type !== 'other' || form.value.advertiser_type_custom)
)

async function register() {
  loading.value = true
  error.value = ''
  try {
    await auth.register(form.value)
    // register() уже авторизует пользователя — сразу редиректим в кабинет
    router.push('/dashboard')
  } catch (e) {
    // PocketBase возвращает data.message для ошибок валидации
    error.value = e?.data?.message || e?.message || 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}
</script>

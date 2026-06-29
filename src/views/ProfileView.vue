<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold mb-1">Мой профиль</h1>
    <p class="text-sm text-brand-gray-dark mb-6">Данные вашей компании на платформе</p>

    <div v-if="loading" class="py-12 text-center text-brand-gray-dark">Загрузка...</div>

    <template v-else>
      <!-- Карточка профиля -->
      <div class="card mb-4">
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="text-lg font-extrabold">{{ profile.company_name || '—' }}</div>
            <div class="text-sm text-brand-gray-dark mt-0.5">{{ profile.brand_name }}</div>
          </div>
          <span class="badge-active text-xs px-3 py-1">Рекламодатель</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label">Название компании</label>
            <input v-model="form.company_name" class="input" :disabled="!editing" />
          </div>
          <div>
            <label class="label">Бренд / Торговая марка</label>
            <input v-model="form.brand_name" class="input" :disabled="!editing" />
          </div>
          <div>
            <label class="label">ИНН</label>
            <input v-model="form.inn" class="input" :disabled="!editing" maxlength="12" />
          </div>
          <div>
            <label class="label">Телефон</label>
            <input v-model="form.phone" class="input" :disabled="!editing" type="tel" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">ФИО ответственного</label>
            <input v-model="form.contact_person" class="input" :disabled="!editing" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Email</label>
            <input v-model="form.email" class="input" disabled type="email" />
            <p class="text-xs text-brand-gray-dark mt-1">Email изменить нельзя — обратитесь в поддержку</p>
          </div>
          <div class="sm:col-span-2">
            <label class="label">Тип рекламодателя</label>
            <select v-model="form.advertiser_type" class="input" :disabled="!editing">
              <option value="supplier">Поставщик / Склад</option>
              <option value="brand">Бренд / Производитель</option>
              <option value="other">Прочее</option>
            </select>
          </div>
          <div v-if="form.advertiser_type === 'other'" class="sm:col-span-2">
            <label class="label">Уточнение типа</label>
            <input v-model="form.advertiser_type_custom" class="input" :disabled="!editing" />
          </div>
        </div>

        <div class="flex gap-3 mt-5">
          <button v-if="!editing" @click="editing = true" class="btn-primary text-sm">Редактировать</button>
          <template v-else>
            <button @click="save" :disabled="saving" class="btn-primary text-sm flex items-center gap-2">
              <span v-if="saving" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Сохранить
            </button>
            <button @click="cancelEdit" class="btn-secondary text-sm">Отмена</button>
          </template>
        </div>

        <div v-if="savedMsg" class="mt-3 text-sm text-green-700 font-medium">✅ {{ savedMsg }}</div>
      </div>

      <!-- Доступы и возможности -->
      <div class="card mb-4">
        <h2 class="font-bold mb-3">Возможности аккаунта</h2>
        <div class="space-y-2">
          <div class="flex items-center justify-between py-2 border-b border-brand-gray-mid last:border-0">
            <div>
              <div class="text-sm font-medium">Публикация новостей</div>
              <div class="text-xs text-brand-gray-dark">Отправка материалов на платформу</div>
            </div>
            <span :class="auth.canSendNews ? 'badge-active' : 'badge-off'">
              {{ auth.canSendNews ? '✓ Разрешено' : 'Недоступно' }}
            </span>
          </div>
          <div class="flex items-center justify-between py-2">
            <div>
              <div class="text-sm font-medium">Статистика показов</div>
              <div class="text-xs text-brand-gray-dark">Аналитика по размещениям</div>
            </div>
            <span :class="auth.hasActiveStats ? 'badge-active' : 'badge-off'">
              {{ auth.hasActiveStats ? '✓ Подключена' : 'Недоступно' }}
            </span>
          </div>
        </div>
        <p class="text-xs text-brand-gray-dark mt-3">
          Для расширения возможностей обратитесь к менеджеру платформы.
        </p>
      </div>

      <!-- Активные размещения -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold">Активные размещения</h2>
          <router-link to="/my-requests" class="btn-ghost text-xs">Все заявки →</router-link>
        </div>
        <div v-if="activeRequests.length === 0" class="text-sm text-brand-gray-dark py-4 text-center">
          Нет активных размещений
        </div>
        <div v-else class="space-y-2">
          <div v-for="r in activeRequests" :key="r.id" class="flex items-center justify-between px-3 py-2 bg-brand-gray rounded-xl">
            <div>
              <div class="text-sm font-semibold">{{ FORMAT_LABELS[r.format_type] }}</div>
              <div class="text-xs text-brand-gray-dark">{{ fmtDate(r.actual_start_date) }} — {{ fmtDate(r.actual_end_date) }}</div>
            </div>
            <span class="badge-active text-xs">Активно</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore }    from '@/stores/auth'
import { useRequestsStore } from '@/stores/requests'

const auth     = useAuthStore()
const reqStore = useRequestsStore()

const loading = ref(true)
const editing = ref(false)
const saving  = ref(false)
const savedMsg = ref('')

const profile = computed(() => auth.profile || {})
const form = ref({})

const FORMAT_LABELS = {
  sponsor_platform:   'Спонсор платформы',
  top10_suppliers:    'Топ-10 поставщиков',
  recommended_brands: 'Рекомендуемые бренды',
  banner:             'Баннер',
}

const activeRequests = computed(() =>
  reqStore.requests.filter(r => r.status === 'active')
)

function fillForm() {
  const p = auth.profile || {}
  form.value = {
    company_name:           p.company_name || '',
    brand_name:             p.brand_name   || '',
    inn:                    p.inn          || '',
    phone:                  p.phone        || '',
    contact_person:         p.contact_person || '',
    email:                  p.email        || '',
    advertiser_type:        p.advertiser_type || '',
    advertiser_type_custom: p.advertiser_type_custom || '',
  }
}

function cancelEdit() {
  editing.value = false
  fillForm()
}

async function save() {
  saving.value = true
  try {
    await auth.updateProfile({
      company_name:           form.value.company_name,
      brand_name:             form.value.brand_name,
      inn:                    form.value.inn,
      phone:                  form.value.phone,
      contact_person:         form.value.contact_person,
      advertiser_type:        form.value.advertiser_type,
      advertiser_type_custom: form.value.advertiser_type_custom,
    })
    editing.value = false
    savedMsg.value = 'Профиль успешно обновлён'
    setTimeout(() => savedMsg.value = '', 3000)
  } catch (e) {
    alert('Ошибка: ' + (e.message || 'Попробуйте ещё раз'))
  } finally {
    saving.value = false
  }
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'
}

onMounted(async () => {
  fillForm()
  if (auth.profile?.id) await reqStore.fetchMyRequests(auth.profile.id)
  loading.value = false
})
</script>

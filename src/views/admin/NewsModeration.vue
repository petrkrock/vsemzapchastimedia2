<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold mb-1">Модерация новостей</h1>
    <p class="text-sm text-brand-gray-dark mb-5">Рассмотрение материалов от рекламодателей</p>

    <div class="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
      <button v-for="f in filters" :key="f.key" @click="activeFilter = f.key"
        class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
        :class="activeFilter === f.key ? 'bg-brand-red text-white' : 'bg-white text-brand-gray-dark'"
      >
        {{ f.label }} <span class="opacity-60">({{ counts[f.key] }})</span>
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-brand-gray-dark">Загрузка...</div>
    <div v-else-if="filtered.length === 0" class="card py-10 text-center text-brand-gray-dark text-sm">
      Нет новостей в этой категории
    </div>

    <div v-else class="space-y-4">
      <div v-for="n in filtered" :key="n.id" class="card"
        :class="n.status === 'submitted' ? 'border-l-4 border-l-brand-red' : ''">
        <div class="flex flex-col sm:flex-row gap-4">
          <div v-if="n.image" class="flex-shrink-0">
            <img :src="getImageUrl(n)" class="w-full sm:w-32 h-32 rounded-xl object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-start gap-2 mb-1">
              <h3 class="font-bold text-brand-black flex-1">{{ n.title }}</h3>
              <span :class="`badge-${n.status}`">{{ STATUS_LABELS[n.status] }}</span>
            </div>
            <div class="text-xs text-brand-gray-dark mb-2">
              <span class="font-medium">{{ n.expand?.advertiser_id?.company_name }}</span>
              <span class="mx-1">·</span>
              {{ n.status === 'submitted' ? `отправлено ${formatDate(n.submitted_at)}` : formatDate(n.created) }}
            </div>
            <p class="text-sm text-brand-black leading-relaxed line-clamp-3">{{ n.content }}</p>
            <div v-if="n.admin_notes" class="mt-2 px-3 py-2 bg-gray-50 border border-brand-gray-mid rounded-lg text-xs text-brand-gray-dark">
              💬 {{ n.admin_notes }}
            </div>
            <div v-if="n.published_at" class="mt-2 text-xs text-green-700">
              ✅ Опубликовано {{ formatDate(n.published_at) }}
            </div>
          </div>
        </div>

        <div v-if="n.status === 'submitted'" class="mt-4 pt-4 border-t border-brand-gray-mid flex flex-col sm:flex-row gap-3">
          <button @click="publish(n)" :disabled="saving[n.id]" class="btn-primary text-sm flex-1 sm:flex-none">✅ Опубликовать</button>
          <button @click="openReject(n)" class="btn-secondary text-sm text-red-600 border-red-200 flex-1 sm:flex-none">✕ Отклонить</button>
        </div>
        <div v-if="n.status === 'published'" class="mt-4 pt-4 border-t border-brand-gray-mid">
          <button @click="unpublish(n)" class="btn-secondary text-xs text-brand-gray-dark">Снять с публикации</button>
        </div>
      </div>
    </div>

    <div v-if="rejectTarget" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="rejectTarget = null">
      <div class="bg-white rounded-2xl p-5 w-full max-w-sm">
        <h2 class="font-bold mb-1">Отклонить новость</h2>
        <p class="text-sm text-brand-gray-dark mb-3">«{{ rejectTarget.title }}»</p>
        <label class="label">Причина отклонения</label>
        <textarea v-model="rejectReason" class="input resize-none" rows="3" placeholder="Укажите причину..."></textarea>
        <div class="flex gap-2 mt-4">
          <button @click="confirmReject" :disabled="!rejectReason" class="btn-primary flex-1" style="background:#dc2626">Отклонить</button>
          <button @click="rejectTarget = null" class="btn-secondary flex-1">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { pb } from '@/lib/pb'

const loading      = ref(true)
const news         = ref([])
const activeFilter = ref('submitted')
const saving       = reactive({})
const rejectTarget = ref(null)
const rejectReason = ref('')

const STATUS_LABELS = { draft: 'Черновик', submitted: 'На модерации', published: 'Опубликовано', rejected: 'Отклонено' }
const filters = [
  { key: 'submitted', label: 'На модерации' },
  { key: 'published', label: 'Опубликованные' },
  { key: 'rejected',  label: 'Отклонённые' },
  { key: 'all',       label: 'Все' },
]

const counts = computed(() => ({
  submitted: news.value.filter(n => n.status === 'submitted').length,
  published: news.value.filter(n => n.status === 'published').length,
  rejected:  news.value.filter(n => n.status === 'rejected').length,
  all:       news.value.length,
}))
const filtered = computed(() => activeFilter.value === 'all' ? news.value : news.value.filter(n => n.status === activeFilter.value))

function getImageUrl(n) {
  return n.image ? pb.files.getUrl(n, n.image, { thumb: '200x200' }) : ''
}

async function fetchNews() {
  const res = await pb.collection('advertiser_news').getList(1, 500, { sort: '-submitted_at', expand: 'advertiser_id' })
  news.value = res.items
}

async function publish(n) {
  saving[n.id] = true
  await pb.collection('advertiser_news').update(n.id, { status: 'published', published_at: new Date().toISOString(), admin_notes: null })
  saving[n.id] = false
  await fetchNews()
}

async function unpublish(n) {
  await pb.collection('advertiser_news').update(n.id, { status: 'submitted', published_at: null })
  await fetchNews()
}

function openReject(n) { rejectTarget.value = n; rejectReason.value = '' }

async function confirmReject() {
  if (!rejectReason.value) return
  await pb.collection('advertiser_news').update(rejectTarget.value.id, { status: 'rejected', admin_notes: rejectReason.value })
  rejectTarget.value = null
  await fetchNews()
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'
}

onMounted(async () => { await fetchNews(); loading.value = false })
</script>

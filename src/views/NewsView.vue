<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-1">
      <h1 class="text-2xl font-extrabold text-brand-black">Новости</h1>
      <button v-if="auth.canSendNews && !showForm" @click="showForm = true; editingNews = null" class="btn-primary">+ Создать</button>
    </div>
    <p class="text-sm text-brand-gray-dark mb-5">Материалы для публикации на платформе ВсемЗапчасти.медиа</p>

    <div v-if="!auth.canSendNews" class="card text-center py-10">
      <div class="text-4xl mb-3">🔒</div>
      <h2 class="font-bold text-brand-black mb-1">Раздел недоступен</h2>
      <p class="text-sm text-brand-gray-dark max-w-sm mx-auto">
        Публикация новостей доступна для спонсоров платформы. Забронируйте пакет «Спонсор платформы», и администратор откроет доступ.
      </p>
      <router-link to="/ad-formats" class="btn-primary mt-4 inline-block">Выбрать формат</router-link>
    </div>

    <template v-else>
      <div v-if="showForm" class="mb-6">
        <NewsForm :news="editingNews" @cancel="closeForm" @saved="onSaved" />
      </div>

      <div v-if="loading" class="py-12 text-center text-brand-gray-dark">Загрузка...</div>

      <div v-else-if="newsList.length === 0 && !showForm" class="card text-center py-10">
        <div class="text-4xl mb-3">📰</div>
        <p class="text-brand-gray-dark mb-3 text-sm">Новостей пока нет</p>
        <button @click="showForm = true" class="btn-primary">Создать первую новость</button>
      </div>

      <div v-else class="space-y-3">
        <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button v-for="f in newsFilters" :key="f.key" @click="activeFilter = f.key"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
            :class="activeFilter === f.key ? 'bg-brand-red text-white' : 'bg-white text-brand-gray-dark'"
          >{{ f.label }}</button>
        </div>

        <div v-for="n in filteredNews" :key="n.id" class="card" :class="n.status === 'rejected' ? 'border border-red-200' : ''">
          <div class="flex items-start gap-3">
            <div v-if="n.image" class="flex-shrink-0">
              <img :src="getImageUrl(n)" class="w-16 h-16 rounded-lg object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-start gap-2">
                <h3 class="font-semibold text-brand-black text-sm flex-1">{{ n.title }}</h3>
                <span :class="`badge-${n.status}`">{{ STATUS_LABELS[n.status] }}</span>
              </div>
              <p class="text-xs text-brand-gray-dark mt-1 line-clamp-2">{{ n.content }}</p>
              <p class="text-xs text-brand-gray-dark mt-1">
                {{ n.status === 'published' ? `Опубликовано ${formatDate(n.published_at)}` :
                   n.status === 'submitted' ? `Отправлено ${formatDate(n.submitted_at)}` :
                   `Создано ${formatDate(n.created)}` }}
              </p>
            </div>
          </div>

          <div v-if="n.admin_notes && n.status === 'rejected'" class="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            💬 <strong>Причина отклонения:</strong> {{ n.admin_notes }}
          </div>

          <div v-if="['draft', 'rejected'].includes(n.status)" class="mt-3 flex gap-2">
            <button @click="editNews(n)" class="btn-secondary text-xs">Редактировать</button>
            <button v-if="n.status === 'draft'" @click="submitNews(n)" class="btn-primary text-xs">Отправить</button>
            <button v-if="n.status === 'rejected'" @click="resubmit(n)" class="btn-primary text-xs">Исправить и переотправить</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { pb } from '@/lib/pb'
import NewsForm from '@/components/NewsForm.vue'

const auth   = useAuthStore()
const loading    = ref(true)
const newsList   = ref([])
const showForm   = ref(false)
const editingNews = ref(null)
const activeFilter = ref('all')

const STATUS_LABELS = { draft: 'Черновик', submitted: 'На модерации', published: 'Опубликовано', rejected: 'Отклонено' }
const newsFilters = [
  { key: 'all',       label: 'Все' },
  { key: 'published', label: 'Опубликовано' },
  { key: 'submitted', label: 'На модерации' },
  { key: 'draft',     label: 'Черновики' },
  { key: 'rejected',  label: 'Отклонено' },
]

const filteredNews = computed(() =>
  activeFilter.value === 'all' ? newsList.value : newsList.value.filter(n => n.status === activeFilter.value)
)

function getImageUrl(n) {
  return n.image ? pb.files.getUrl(n, n.image, { thumb: '128x128' }) : ''
}

async function fetchNews() {
  const res = await pb.collection('advertiser_news').getList(1, 500, {
    filter: `advertiser_id = "${auth.profile.id}"`,
    sort: '-created',
  })
  newsList.value = res.items
}

function editNews(n) { editingNews.value = n; showForm.value = true }

async function submitNews(n) {
  await pb.collection('advertiser_news').update(n.id, { status: 'submitted', submitted_at: new Date().toISOString() })
  await fetchNews()
}

function resubmit(n) { editingNews.value = n; showForm.value = true }
function closeForm()  { showForm.value = false; editingNews.value = null }
async function onSaved() { closeForm(); await fetchNews() }

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

onMounted(async () => {
  if (auth.canSendNews && auth.profile?.id) await fetchNews()
  loading.value = false
})
</script>

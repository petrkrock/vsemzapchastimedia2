<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold text-brand-black">{{ editing ? 'Редактировать новость' : 'Новая новость' }}</h3>
      <button @click="$emit('cancel')" class="text-brand-gray-dark hover:text-brand-black text-xl leading-none">×</button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="label">Заголовок *</label>
        <input v-model="form.title" class="input" placeholder="Например: Новинки сезона — запчасти BMW" maxlength="120" />
        <p class="text-xs text-brand-gray-dark mt-1">{{ form.title.length }}/120</p>
      </div>

      <div>
        <label class="label">Текст новости *</label>
        <textarea v-model="form.content" class="input resize-none" rows="5" placeholder="Расскажите о вашем предложении, акции или новинке..."></textarea>
      </div>

      <div>
        <label class="label">Изображение (необязательно)</label>
        <div
          class="border-2 border-dashed border-brand-gray-mid rounded-xl p-6 text-center cursor-pointer hover:border-brand-red transition-colors"
          @click="$refs.fileInput.click()"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <div v-if="!previewUrl">
            <div class="text-3xl mb-2">🖼</div>
            <p class="text-sm text-brand-gray-dark">Нажмите или перетащите файл</p>
            <p class="text-xs text-brand-gray-dark mt-1">JPG, PNG, WebP до 5 МБ</p>
          </div>
          <div v-else class="relative">
            <img :src="previewUrl" class="max-h-32 mx-auto rounded-lg object-cover" />
            <button @click.stop="removeImage" class="absolute top-1 right-1 bg-brand-red text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">×</button>
          </div>
        </div>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFile" />
      </div>

      <div class="flex gap-3">
        <button @click="save('draft')" :disabled="loading || !form.title" class="btn-secondary flex-1">
          Сохранить черновик
        </button>
        <button @click="save('submitted')" :disabled="loading || !form.title || !form.content" class="btn-primary flex-1 flex justify-center">
          <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
          Отправить на модерацию
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { pb } from '@/lib/pb'

const props = defineProps({ news: Object })
const emit  = defineEmits(['cancel', 'saved'])

const auth      = useAuthStore()
const loading   = ref(false)
const previewUrl = ref(null)
const imageFile  = ref(null)
const fileInput  = ref(null)

const editing = !!props.news?.id
const form = ref({
  title:   props.news?.title   || '',
  content: props.news?.content || '',
})

onMounted(() => {
  if (props.news?.image) {
    // PocketBase: URL файла формируется по record
    previewUrl.value = pb.files.getUrl(props.news, props.news.image)
  }
})

function handleFile(e) {
  const file = e.target.files[0]
  if (!file) return
  imageFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function handleDrop(e) {
  const file = e.dataTransfer.files[0]
  if (!file) return
  imageFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function removeImage() {
  previewUrl.value = null
  imageFile.value  = null
}

async function save(status) {
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('advertiser_id', auth.profile.id)
    formData.append('title',   form.value.title)
    formData.append('content', form.value.content)
    formData.append('status',  status)
    if (status === 'submitted') formData.append('submitted_at', new Date().toISOString())

    // Если есть новое изображение — прикладываем через FormData
    if (imageFile.value) formData.append('image', imageFile.value)

    if (editing) {
      await pb.collection('advertiser_news').update(props.news.id, formData)
    } else {
      await pb.collection('advertiser_news').create(formData)
    }

    emit('saved')
  } catch (e) {
    alert('Ошибка: ' + (e.message || 'Попробуйте ещё раз'))
  } finally {
    loading.value = false
  }
}
</script>

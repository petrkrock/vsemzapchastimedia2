import PocketBase from 'pocketbase'

// URL PocketBase сервера
// Локальная разработка: http://127.0.0.1:8090
// Продакшн: https://pb.vsemzapchasti.media
const PB_URL = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090'

export const pb = new PocketBase(PB_URL)

// Отключаем авто-отмену запросов
pb.autoCancellation(false)

/**
 * Читаемое сообщение из ошибки PocketBase
 * Использование: catch(e) { alert(pbError(e)) }
 */
export function pbError(e) {
  // PocketBase кладёт детали в e.data.message или e.data.data
  if (e?.data?.message) return e.data.message
  if (e?.message)       return e.message
  return 'Неизвестная ошибка'
}

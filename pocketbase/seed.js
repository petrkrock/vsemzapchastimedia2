#!/usr/bin/env node
/**
 * seed.js — начальные данные для PocketBase
 * Запуск: node seed.js
 * Требует: npm install node-fetch (или Node 18+)
 *
 * Перед запуском:
 * 1. Запустите PocketBase: ./pocketbase serve
 * 2. Создайте admin-аккаунт через http://127.0.0.1:8090/_/
 * 3. Заполните PB_ADMIN_EMAIL и PB_ADMIN_PASSWORD ниже
 */

const PB_URL          = process.env.PB_URL    || 'http://127.0.0.1:8090'
const PB_ADMIN_EMAIL  = process.env.PB_EMAIL  || 'admin@vsemzapchasti.media'
const PB_ADMIN_PASS   = process.env.PB_PASS   || 'changeme123'

async function api(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = token
  const res = await fetch(`${PB_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return data
}

async function main() {
  // 1. Авторизация как суперадмин
  const auth = await api('/admins/auth-with-password', 'POST', {
    identity: PB_ADMIN_EMAIL,
    password: PB_ADMIN_PASS,
  })
  const token = auth.token
  console.log('✓ Авторизован как администратор')

  // 2. Начальные тарифы
  const pricingData = [
    {
      format_type:         'sponsor_platform',
      base_price_monthly:  35000,
      min_months:          6,
      bonus_description:   '2 новости в месяц',
      available_durations: [6, 12],
      duration_discounts:  [{ months: 6, discount: 0 }, { months: 12, discount: 20 }],
    },
    {
      format_type:         'top10_suppliers',
      base_price_monthly:  20000,
      min_months:          3,
      bonus_description:   '',
      available_durations: [1, 3, 6, 12],
      duration_discounts:  [{ months: 1, discount: 0 }, { months: 3, discount: 5 }, { months: 6, discount: 10 }, { months: 12, discount: 15 }],
    },
    {
      format_type:         'recommended_brands',
      base_price_monthly:  20000,
      min_months:          1,
      bonus_description:   '',
      available_durations: [1, 3, 6, 12],
      duration_discounts:  [{ months: 1, discount: 0 }, { months: 3, discount: 5 }, { months: 6, discount: 10 }, { months: 12, discount: 15 }],
    },
    {
      format_type:         'banner_1',
      base_price_monthly:  35000,
      min_months:          1,
      bonus_description:   '',
      available_durations: [1, 3, 6, 12],
      duration_discounts:  [{ months: 1, discount: 0 }, { months: 3, discount: 0 }, { months: 6, discount: 5 }, { months: 12, discount: 10 }],
    },
    {
      format_type:         'banner_2',
      base_price_monthly:  25000,
      min_months:          1,
      bonus_description:   '',
      available_durations: [1, 3, 6, 12],
      duration_discounts:  [{ months: 1, discount: 0 }, { months: 3, discount: 0 }, { months: 6, discount: 5 }, { months: 12, discount: 10 }],
    },
    {
      format_type:         'banner_3',
      base_price_monthly:  20000,
      min_months:          1,
      bonus_description:   '',
      available_durations: [1, 3, 6, 12],
      duration_discounts:  [{ months: 1, discount: 0 }, { months: 3, discount: 0 }, { months: 6, discount: 5 }, { months: 12, discount: 10 }],
    },
  ]

  for (const p of pricingData) {
    await api('/collections/pricing_config/records', 'POST', p, token)
    console.log(`  ✓ Тариф: ${p.format_type}`)
  }

  // 3. Слоты: sponsor_platform (6), top10_suppliers (10), recommended_brands (30), banner (3)
  const slotDefs = [
    { format_type: 'sponsor_platform',   count: 6  },
    { format_type: 'top10_suppliers',    count: 10 },
    { format_type: 'recommended_brands', count: 30 },
    { format_type: 'banner',             count: 3  },
  ]

  for (const def of slotDefs) {
    for (let n = 1; n <= def.count; n++) {
      await api('/collections/ad_slots/records', 'POST', {
        format_type:  def.format_type,
        slot_number:  n,
        is_occupied:  false,
      }, token)
    }
    console.log(`  ✓ Слоты ${def.format_type}: ${def.count} шт.`)
  }

  console.log('\n✅ Начальные данные успешно загружены!')
  console.log('   Теперь создайте admin-профиль через интерфейс приложения или напрямую в PocketBase.')
}

main().catch(e => { console.error('❌ Ошибка:', e.message); process.exit(1) })

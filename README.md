# ВсемЗапчасти.медиа — Рекламная платформа

## Стек технологий

| Компонент | Технология |
|-----------|-----------|
| Frontend  | Vue 3 + Vite + Pinia + Vue Router |
| Стили     | Tailwind CSS 3.4 |
| Backend   | PocketBase (self-hosted, Go + SQLite) |
| Хранилище | PocketBase Files (встроенное) |

> **Почему PocketBase?** Работает в России без VPN, self-hosted, единый бинарный файл, не требует внешних сервисов.

---

## Быстрый старт

### 1. Скачать и запустить PocketBase

```bash
# Скачайте бинарник с https://pocketbase.io/docs/
# Linux / macOS
./pocketbase serve

# Windows
pocketbase.exe serve
```

PocketBase запустится на **http://127.0.0.1:8090**  
Admin UI: **http://127.0.0.1:8090/_/**

### 2. Создать схему БД

Settings → Import collections → вставьте содержимое `pocketbase/schema.json`

### 3. Загрузить начальные данные

```bash
# Node 18+
PB_EMAIL=admin@example.com PB_PASS=yourpassword node pocketbase/seed.js
```

Seed создаст:
- 6 слотов «Спонсор платформы»
- 10 слотов «Топ-10 поставщиков»  
- 30 слотов «Рекомендуемые бренды»
- 3 баннерных слота
- Тарифы для всех форматов

### 4. Настроить и запустить frontend

```bash
npm install

# Создайте .env
echo "VITE_PB_URL=http://127.0.0.1:8090" > .env

npm run dev
```

Приложение: **http://localhost:5173**

---

## Структура проекта

```
src/
├── assets/
│   └── main.css              # Глобальные стили (Tailwind + кастомные классы)
├── components/
│   ├── AppHeader.vue         # Шапка + навигация (бейдж событий для админа)
│   ├── MobileNav.vue         # Нижняя навигация мобильная
│   ├── BookingForm.vue       # Форма запроса на размещение
│   ├── FileUpload.vue        # Переиспользуемый загрузчик PDF
│   ├── FormatCard.vue        # Карточка формата со статистикой (без слотов)
│   ├── InvoiceForm.vue       # Создание счёта + прикрепление PDF + договора
│   ├── NewsForm.vue          # Форма создания/редактирования новости
│   ├── RequestCard.vue       # Карточка заявки
│   ├── SlotCard.vue          # Карточка слота (для баннеров)
│   └── BrandLogo.vue         # Логотип платформы
├── lib/
│   └── pb.js                 # PocketBase клиент
├── router/
│   └── index.js              # Маршруты с guard-ами
├── stores/
│   ├── auth.js               # Аутентификация, профиль
│   ├── requests.js           # Заявки на размещение
│   ├── slots.js              # Слоты и тарифы
│   └── stats.js              # Статистика показов
└── views/
    ├── AdFormatsView.vue      # Форматы рекламы (статистика + баннеры)
    ├── DashboardView.vue      # Кабинет рекламодателя
    ├── FinancesView.vue       # Финансы (счета, договоры, акты)
    ├── LoginView.vue          # Вход
    ├── MyRequestsView.vue     # Мои заявки
    ├── NewsView.vue           # Новости рекламодателя
    ├── ProfileView.vue        # Профиль рекламодателя
    ├── RegisterView.vue       # Регистрация
    ├── StatisticsView.vue     # Статистика показов
    └── admin/
        ├── AdminDashboard.vue  # Дашборд администратора
        ├── AdvertisersList.vue # Управление рекламодателями
        ├── BookingsView.vue    # Бронирование (главный рабочий раздел)
        ├── EventsFeedView.vue  # Лента событий и напоминаний
        ├── NewsModeration.vue  # Модерация новостей
        ├── OccupancyView.vue   # Загруженность слотов
        └── PricingView.vue     # Управление тарифами

pocketbase/
├── schema.json               # Схема всех коллекций
└── seed.js                   # Начальные данные
```

---

## Коллекции PocketBase

| Коллекция | Назначение |
|-----------|-----------|
| `users` | Auth-аккаунты (email + пароль) |
| `profiles` | Данные рекламодателей: компания, ИНН, тип, права |
| `ad_slots` | Рекламные места: формат, номер, статус занятости |
| `placement_requests` | Заявки на размещение — полный workflow |
| `advertiser_news` | Новости рекламодателей с файлом изображения |
| `pricing_config` | Тарифы: цена, сроки, скидки по длительности |
| `stats_config` | Настройки сбора статистики по рекламодателю |
| `advertiser_stats` | Ежедневная статистика показов по формату |

### Ключевые поля placement_requests

| Поле | Тип | Описание |
|------|-----|---------|
| `status` | select | pending → payment_pending → paid → active → completed |
| `invoice_file` | file (PDF) | Счёт на оплату |
| `contract_file` | file (PDF) | Договор |
| `completion_act_file` | file (PDF) | Акт выполненных работ |
| `actual_start_date` | date | Дата начала (назначает администратор) |
| `actual_end_date` | date | Дата окончания |
| `assigned_slot_id` | relation | Назначенный слот (для баннеров) |

---

## Логика рекламных форматов

### Спонсоры платформы / Топ-10 / Рекомендуемые бренды

Показывается **статистика цифрами** (без сетки слотов):
- 🟢 Свободно — количество свободных мест
- 🔴 Занято — количество активных размещений
- 🟡 Освобождается — места с датой окончания ≤ 30 дней
- 🔵 Забронировано на следующий период — заявки со статусом `payment_pending`/`paid` с датой начала в будущем

**Бронь на следующий период** может создать только **администратор** (выставить счёт + назначить даты). Рекламодатель отправляет запрос (`status: pending`), который не считается бронью.

### Баннеры (3 слота)

Сетка из 3 баннеров с индивидуальным статусом каждого. Рекламодатель **выбирает конкретный баннер**, затем отправляет запрос. Для каждого баннера показывается:
- Текущий статус (свободен / занят до даты / освобождается)
- Бронь на следующий период если есть

---

## Workflow заявки

```
Рекламодатель            Администратор
     │                        │
     ├─ Отправить запрос ─────►│ status: pending
     │                        │
     │                        ├─ Создать счёт + договор
     │                        │  Назначить даты и слот
     │                        │  status: payment_pending
     │◄───── Счёт выставлен ──┤
     │                        │
     ├─ Оплатить ─────────────►│ status: paid
     │                        │
     │                        ├─ Активировать
     │                        │  status: active
     │◄── Размещение активно ─┤
     │                        │
     │                        ├─ Завершить + прикрепить акт
     │                        │  status: completed
     │◄─── Акт выполн. работ ─┤
```

---

## Финансы рекламодателя

В разделе **Финансы** (`/finances`) для каждой заявки доступны:
- **Счёт** — скачать PDF (`invoice_file`)
- **Договор** — скачать PDF (`contract_file`)
- **Акт выполненных работ** — скачать PDF (`completion_act_file`), появляется только после завершения

---

## Лента событий (админ)

Раздел **События** (`/admin/events`) автоматически собирает:

| Категория | Условие | Срочность |
|-----------|---------|-----------|
| 📋 Новый запрос | `status = pending` | Срочно если > 2 дней |
| ⚠️ Просроченная оплата | `payment_due_date < today` | Всегда срочно |
| 💳 Ожидает оплаты | `status = payment_pending` | Срочно если ≤ 3 дней |
| ⏰ Истекает скоро | `actual_end_date` ≤ 7 дней | Срочно |
| 🔴 Истекло без завершения | `actual_end_date < today`, `status = active` | Всегда срочно |
| 🔄 Запрос на продление | `renewal_requested = true` | Обычное |
| 📰 Новость на модерации | `status = submitted` | Срочно если > 3 дней |

Бейдж с числом срочных событий отображается в навигации рядом с «События».

---

## Статистика показов

Раздел **Статистика** (`/statistics`) доступен рекламодателю только при `profile.stats_enabled = true`.

**Фильтрация по формату**: если у рекламодателя несколько активных размещений — выпадающий список «Вся статистика» / «Конкретный формат».

**Источники данных** (настраивает администратор):
- Внутренний счётчик платформы
- Яндекс.Метрика
- Кастомный API-эндпоинт

Данные хранятся в коллекции `advertiser_stats` с полем `format_type` для разделения по форматам.

---

## Переменные окружения

```env
# .env
VITE_PB_URL=http://127.0.0.1:8090      # Локальная разработка
# VITE_PB_URL=https://pb.domain.ru     # Продакшн
```

---

## Продакшн деплой

### PocketBase как systemd-сервис

```ini
# /etc/systemd/system/pocketbase.service
[Unit]
Description=PocketBase — ВсемЗапчасти.медиа
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/pb
ExecStart=/var/www/pb/pocketbase serve --http=127.0.0.1:8090
Restart=always

[Install]
WantedBy=multi-user.target
```

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name vsemzapchasti.media;

    # Vue SPA
    root /var/www/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}

server {
    listen 443 ssl;
    server_name pb.vsemzapchasti.media;
    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        client_max_body_size 20m;
    }
}
```

### Сборка фронтенда

```bash
npm run build
# Результат в /dist — загрузить на сервер
```

---

## Тарифы и скидки (настройка)

**Админ → Цены** (`/admin/pricing`):

Для каждого формата настраивается:
- Базовая цена/мес
- Доступные сроки (кнопки 1 / 3 / 6 / 12 мес. включить/выключить)
- Скидка (%) для каждого срока
- Бонус (текст, например «2 новости/мес»)

Данные хранятся в `pricing_config.available_durations` (JSON-массив) и `pricing_config.duration_discounts` (JSON-массив `[{months, discount}]`).

---

## Создание администратора

1. Зарегистрируйтесь через интерфейс как обычный рекламодатель
2. В PocketBase Admin UI → Collections → `profiles` → найдите запись → измените `role` на `admin`

---

## Версия

v2.0 — переход с Supabase на PocketBase, новые разделы: Бронь, События, Загруженность, Финансы с документами, Профиль, Статистика с фильтром по формату.

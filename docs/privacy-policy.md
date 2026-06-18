# Privacy Policy — Ads stat

**Last updated:** June 18, 2026

**Developer / Operator:** Ads stat  
**Contact:** militerte@gmail.com

---

## English

### 1. Overview

**Ads stat** is a Google Sheets add-on that lets you import statistics from **Yandex Metrica** and **Yandex Direct** into your spreadsheet. This Privacy Policy explains what data the add-on processes, where it is stored, and how you can control it.

By installing and using Ads stat, you agree to this policy.

### 2. Data we process

#### 2.1 Google account data

When you install the add-on, Google may ask you to grant permissions, including:

| Permission | Purpose |
|------------|---------|
| Access to the current spreadsheet | Write report data to sheets you choose |
| Connect to external services | Call Yandex Metrica and Yandex Direct APIs |
| Show UI in Google Sheets | Display the add-on sidebar |
| Run when you are not present | Optional daily refresh of saved reports (time triggers) |
| View your email address | Identify your Google account for add-on authorization |

We do **not** sell your Google account data.

#### 2.2 Yandex account data

When you sign in with Yandex, the add-on may access and store:

- OAuth access and refresh tokens (to call Yandex APIs on your behalf)
- Yandex user ID, login, and email (to show which account is connected and to support multiple accounts)

With your authorization, the add-on requests statistics from:

- **Yandex Metrica** (counters, reports, goals, UTM-related data you configure)
- **Yandex Direct** (campaign, ad group, and ad statistics you configure)

Report results are written **only into your Google Spreadsheet**.

#### 2.3 Data stored in your spreadsheet

The add-on may store in **document properties** of the spreadsheet (metadata attached to the file, not visible as sheet cells):

- Selected Metrica counter ID and name
- Saved report presets (names, parameters, sheet names, filters)
- Schedule settings for automatic refresh (enabled/disabled, time)
- Last report request parameters (for convenience)

This data stays in **your** spreadsheet file and is accessible to users who can edit that file.

#### 2.4 Data we do not collect on our own servers

Ads stat runs on **Google Apps Script**. We do **not** operate a separate backend database for end-user analytics data. Report data flows: **Yandex API → Apps Script → your spreadsheet**.

### 3. Where data is stored

| Data | Location |
|------|----------|
| Yandex OAuth tokens, account registry | Google Apps Script **UserProperties** (per Google user) |
| Saved presets, schedule, counter selection | Google **DocumentProperties** (per spreadsheet) |
| Yandex OAuth app credentials (Client ID / Secret) | Google Apps Script **ScriptProperties** (set once by the developer; not visible to end users) |
| Report rows | Cells in **your Google Spreadsheet** |

### 4. Third-party services

The add-on communicates with:

- **Google** (Google Sheets, Apps Script, authorization)
- **Yandex** (`oauth.yandex.ru`, `login.yandex.ru`, `api-metrika.yandex.net`, `api.direct.yandex.com`)

Their privacy policies apply to data processed on their systems:

- Google: https://policies.google.com/privacy  
- Yandex: https://yandex.com/legal/confidential/

### 5. How we use data

We use processed data only to:

- Authenticate you with Yandex
- Fetch the reports you request
- Write results to your spreadsheet
- Save your presets and optional refresh schedule
- Display account status in the add-on UI

We do not use your data for advertising or sell it to third parties.

### 6. Data retention and deletion

- **Yandex tokens and account list:** Removed when you click **Sign out** in the add-on, or when you revoke access at https://oauth.yandex.ru/  
- **Presets and schedule:** Stored in the spreadsheet until you delete them in the add-on or remove the spreadsheet  
- **Spreadsheet report data:** Remains until you delete cells or the file  
- **Uninstalling the add-on:** Does not automatically delete data already written to spreadsheets or document properties; revoke Yandex access separately if needed

### 7. Security

- Connections use HTTPS.
- Yandex tokens are stored in Google’s Apps Script user property store, isolated per user.
- Only users with access to a spreadsheet can read its document properties and sheet data.

### 8. Children

Ads stat is not directed at children under 13 (or the minimum age required in your country). We do not knowingly collect children’s data.

### 9. Changes

We may update this policy. The “Last updated” date at the top will change. Continued use after changes means you accept the updated policy.

### 10. Contact

Questions about this policy or your data: **militerte@gmail.com**

---

## Русский

### 1. Общие положения

**Ads stat** — дополнение для Google Таблиц, которое загружает статистику из **Яндекс.Метрики** и **Яндекс.Директа** в вашу таблицу. Эта политика описывает, какие данные обрабатываются, где хранятся и как ими управлять.

Устанавливая и используя дополнение, вы соглашаетесь с этой политикой.

### 2. Какие данные обрабатываются

#### 2.1 Данные аккаунта Google

При установке Google запрашивает разрешения, в том числе:

| Разрешение | Зачем |
|------------|--------|
| Доступ к текущей таблице | Запись отчётов на выбранные листы |
| Внешние запросы | Обращение к API Яндекс.Метрики и Директа |
| Интерфейс в Google Таблицах | Боковая панель дополнения |
| Запуск без вашего присутствия | Опциональное ежедневное обновление сохранённых отчётов |
| Адрес электронной почты | Идентификация аккаунта Google при авторизации дополнения |

Мы **не продаём** данные вашего аккаунта Google.

#### 2.2 Данные аккаунта Яндекса

При входе через Яндекс дополнение может получать и хранить:

- OAuth-токены (для запросов к API от вашего имени)
- ID, логин и email пользователя Яндекса (отображение подключённого аккаунта, несколько аккаунтов)

По вашему запросу загружается статистика из:

- **Яндекс.Метрики** (счётчики, отчёты, цели, UTM — по вашим настройкам)
- **Яндекс.Директа** (статистика кампаний, групп и объявлений — по вашим настройкам)

Результаты записываются **только в вашу Google Таблицу**.

#### 2.3 Данные в таблице

В **свойствах документа** таблицы (служебные метаданные файла, не ячейки) могут храниться:

- ID и название выбранного счётчика Метрики
- Сохранённые пресеты отчётов
- Настройки расписания автообновления
- Параметры последнего запроса

Доступ к ним имеют пользователи с правом редактирования этой таблицы.

#### 2.4 Отдельный сервер оператора

Дополнение работает на **Google Apps Script**. Мы **не** ведём отдельную базу данных с отчётами пользователей. Цепочка: **API Яндекса → Apps Script → ваша таблица**.

### 3. Где хранятся данные

| Данные | Место |
|--------|--------|
| Токены и список аккаунтов Яндекса | **UserProperties** Apps Script (на пользователя Google) |
| Пресеты, расписание, счётчик | **DocumentProperties** (на файл таблицы) |
| Client ID / Secret OAuth Яндекса | **ScriptProperties** проекта (настраивает разработчик) |
| Строки отчётов | **Ячейки Google Таблицы** |

### 4. Сторонние сервисы

- **Google** (Таблицы, Apps Script, авторизация)
- **Яндекс** (`oauth.yandex.ru`, `login.yandex.ru`, `api-metrika.yandex.net`, `api.direct.yandex.com`)

Политики конфиденциальности:

- Google: https://policies.google.com/privacy  
- Яндекс: https://yandex.com/legal/confidential/

### 5. Цели использования

Данные используются только чтобы:

- авторизовать вас в Яндексе;
- загрузить запрошенные отчёты;
- записать их в таблицу;
- сохранить пресеты и расписание;
- показать статус в интерфейсе.

Данные не используются для рекламы и не продаются третьим лицам.

### 6. Удаление данных

- **Токены Яндекса:** кнопка **Выйти** в дополнении или отзыв доступа на https://oauth.yandex.ru/  
- **Пресеты и расписание:** удаление в дополнении или удаление файла таблицы  
- **Данные в ячейках:** удаляете вы вручную  
- **Удаление дополнения** не стирает уже записанные в таблицу данные автоматически

### 7. Безопасность

- Передача по HTTPS.
- Токены Яндекса изолированы по пользователю Google в UserProperties.
- К таблице и её метаданным имеют доступ только пользователи с соответствующими правами.

### 8. Дети

Дополнение не предназначено для лиц младше 13 лет (или минимального возраста по закону вашей страны).

### 9. Изменения

Политика может обновляться; дата в начале документа будет меняться.

### 10. Контакты

Вопросы: **militerte@gmail.com**

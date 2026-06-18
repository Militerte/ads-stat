# Яндекс: Метрика и Директ — дополнение Google Sheets

Standalone Editor Add-on с OAuth-авторизацией через аккаунт Яндекса.

На этом этапе реализована только **авторизация** (проверка токена и профиля). Загрузка статистики — следующий шаг.

## 1. Создать standalone-проект Apps Script

1. Откройте [script.google.com](https://script.google.com) → **Новый проект** (не из таблицы).
2. Переименуйте проект, например: `Yandex Sheets Add-on`.

## 2. Загрузить код (clasp)

```powershell
cd C:\Users\milit\Projects\yandex-sheets-addon
npm install
npm run login
copy .clasp.json.example .clasp.json
```

В `.clasp.json` вставьте **Script ID** из **Настройки проекта** в Apps Script.

> **Важно:** не оставляйте `PASTE_YOUR_SCRIPT_ID_HERE` — иначе `clasp push` выдаст  
> `Request contains an invalid argument`.

Включите [Google Apps Script API](https://script.google.com/home/usersettings).

```powershell
npm run push
```

## 3. Подключить библиотеку OAuth2

После `push` в редакторе Apps Script:

**Библиотеки** → добавить `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF` (символ: `OAuth2`, версия 43).

> Библиотека также указана в `appsscript.json`; после push clasp обычно подключает её автоматически.

## 4. Сохранить Client ID и Client Secret

В `src/Auth.gs` функция `setupYandexCredentials()` — замените плейсхолдеры на значения из [oauth.yandex.ru](https://oauth.yandex.ru/) и **запустите один раз** в редакторе Apps Script.

## 5. Redirect URI в Яндексе

В редакторе Apps Script запустите `logYandexRedirectUri()` и скопируйте URI из лога.

Для вашего проекта URI должен быть таким:

```
https://script.google.com/macros/d/19Y_NuBa73kIt73WrIsXnYH-HgUiD3mOS6iRk5rThGYqe9JT3wOQsd-uP/usercallback
```

### Куда вставить в Яндексе

1. Откройте [oauth.yandex.ru](https://oauth.yandex.ru/) → ваше приложение.
2. Раздел **Платформы** → **Веб-сервисы** (если нет — добавьте платформу).
3. Поле **Redirect URI** / **Callback URL** → вставьте URL **целиком**.
4. **Сохранить**.

### Частые ошибки

| Ошибка | Правильно |
|--------|-----------|
| URL таблицы или deployment ID | Script ID из **Настройки проекта** Apps Script |
| `.../usercallback/` (слэш в конце) | `.../usercallback` без слэша |
| `http://` вместо `https://` | только `https://` |
| Другой Script ID (старый проект) | ID **этого** standalone-проекта |

После сохранения в Яндексе подождите 1–2 минуты и попробуйте вход снова.

## 6. Тестовое развёртывание дополнения

1. Apps Script → **Развёртывание** → **Тестовые развёртывания**.
2. Тип: **Дополнение**.
3. Сохраните.

## 7. Проверка в Google Таблицах

1. Откройте любую Google Таблицу.
2. **Расширения** → **Дополнения** → **Тестовые дополнения на G Suite Marketplace**.
3. Выберите ваш проект.
4. В боковой панели: **Войти через Яндекс** → подтвердите доступ.
5. После успеха должны отображаться логин Яндекса и статус авторизации.

## Отладка

### `Request contains an invalid argument` при `npm run push`

Почти всегда в `.clasp.json` не заменён Script ID (осталось `PASTE_YOUR_SCRIPT_ID_HERE`).

**Где взять ID:**
1. [script.google.com](https://script.google.com) → ваш standalone-проект
2. Слева **Проект** → **Настройки проекта**
3. Поле **Идентификатор скрипта** → скопировать

Пример `.clasp.json`:
```json
{
  "scriptId": "1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEf",
  "rootDir": "./src"
}
```

Проверка перед push: `npm run check:clasp`

### `Invalid ID` при `npm run push`

Чаще всего — **неверный libraryId** в `src/appsscript.json` (библиотека OAuth2).  
Правильный ID: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`

Также проверьте:
- вы залогинены в clasp тем же Google-аккаунтом, что владеет проектом (`npm run login`);
- Script ID скопирован из **Настройки проекта** Apps Script, а не из URL таблицы.

| Функция | Назначение |
|---------|------------|
| `logYandexRedirectUri()` | Redirect URI для oauth.yandex.ru |
| `resetYandexAuth()` | Сбросить токен текущего пользователя |
| `setupYandexCredentials()` | Сохранить Client ID / Secret |

## Структура

| Файл | Назначение |
|------|------------|
| `src/Main.gs` | UI карточки дополнения |
| `src/Auth.gs` | OAuth-поток Яндекса |
| `src/Config.gs` | Client ID / Secret в Script Properties |
| `src/appsscript.json` | Манифест add-on |

## Важно

- Токен Яндекса хранится в **UserProperties** — у каждого пользователя свой.
- Client ID / Secret — в **ScriptProperties** проекта (один раз настраивает разработчик).
- Для API Директа нужна **одобренная заявка** на direct.yandex.ru (отдельно от OAuth).

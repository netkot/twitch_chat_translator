# Chrome Web Store — Listing texts

Тексты для карточки расширения в Developer Dashboard.
Лимиты: **Name** ≤ 45 символов, **Summary** ≤ 132 символа,
**Description** ≤ 16 000 символов.

Локализованные название и краткое описание уже берутся из `_locales/`
(`appName` / `appDesc`) — здесь дан тот же текст плюс развёрнутое описание.

---

## EN

**Name** (≤45)
```
Twitch Chat Translator
```

**Summary** (≤132)
```
Translate Twitch chat in real time. In-place translation, auto chat-language detection, and translate your own messages too.
```

**Category:** Communication (или Tools)

**Description**
```
Twitch Chat Translator translates Twitch chat messages into your language in
real time. The translation replaces the original text in place, so translated
messages look exactly like normal chat — no clutter, no extra bubbles.

FEATURES
• Real-time translation of new chat messages as they arrive.
• In-place text replacement — clean, native-looking chat.
• Automatic chat-language detection (shown in the popup).
• Translate your OWN outgoing messages:
   – Ctrl+Enter to translate your text in the input box (review, then send).
   – Optional "auto-translate on Enter" to translate and send instantly.
   – Choose your message language: "Auto (chat language)" or a fixed one.
• Three translation providers:
   – Google (no key) — free, works out of the box (default).
   – Google Cloud Translation — official API (your key).
   – DeepL — high-quality API (your key).
• Interface localized into 12 languages (EN, RU, UK, ES, DE, FR, PT, PL, TR,
  ZH, JA, KO), auto-selected by your browser language.
• Translation cache so repeated messages aren't re-translated.
• Works with native Twitch chat AND the 7TV "new chat" — only text is
  replaced; emotes, mentions and links stay intact.

PRIVACY
No data is collected by the developer. Text is sent only to the translation
provider you choose (Google or DeepL) to perform the translation. Your settings
and any API key are stored locally in your browser.

HOW TO USE
Install, open any twitch.tv channel, and chat starts translating. Click the
extension icon to choose your language, provider, and outgoing-message options.
```

---

## RU

**Name** (≤45)
```
Переводчик чата Twitch
```

**Summary** (≤132)
```
Перевод чата Twitch в реальном времени. Замена текста на месте, автоопределение языка и перевод ваших сообщений.
```

**Категория:** Общение (Communication) или Инструменты

**Description**
```
Переводчик чата Twitch переводит сообщения чата на ваш язык в реальном времени.
Перевод заменяет исходный текст прямо на месте — переведённые сообщения выглядят
как обычный чат, без лишних пометок и пузырей.

ВОЗМОЖНОСТИ
• Перевод новых сообщений чата на лету.
• Замена текста на месте — чистый, привычный вид чата.
• Автоопределение языка чата (показывается в попапе).
• Перевод ВАШИХ исходящих сообщений:
   – Ctrl+Enter — перевести текст прямо в поле ввода (проверить и отправить).
   – Тумблер «Авто-перевод при Enter» — перевести и сразу отправить.
   – Язык ваших сообщений: «Авто (язык чата)» или фиксированный.
• Три сервиса перевода:
   – Google (без ключа) — бесплатно, работает сразу (по умолчанию).
   – Google Cloud Translation — официальный API (ваш ключ).
   – DeepL — качественный API (ваш ключ).
• Интерфейс на 12 языках (EN, RU, UK, ES, DE, FR, PT, PL, TR, ZH, JA, KO),
  выбирается по языку браузера.
• Кеш переводов — повторяющиеся сообщения не переводятся заново.
• Поддержка нативного чата Twitch И «new chat» от 7TV — заменяется только
  текст; эмоуты, упоминания и ссылки остаются нетронутыми.

КОНФИДЕНЦИАЛЬНОСТЬ
Разработчик не собирает никаких данных. Текст отправляется только выбранному
вами провайдеру (Google или DeepL) для перевода. Настройки и API-ключ хранятся
локально в браузере.

КАК ПОЛЬЗОВАТЬСЯ
Установите, откройте любой канал на twitch.tv — чат начнёт переводиться.
Нажмите на иконку расширения, чтобы выбрать язык, провайдер и параметры
перевода исходящих сообщений.
```

---

## Графические ассеты (требования магазина, для справки)

- **Иконка магазина:** 128×128 PNG — уже есть (`icons/icon128.png`).
- **Скриншоты:** минимум 1, обычно 1280×800 или 640×400 PNG/JPG.
  Сделай 2–4: чат с переводом, попап настроек, перевод исходящего сообщения.
- **Small promo tile (опц.):** 440×280 PNG.
- **Marquee promo (опц.):** 1400×560 PNG.

# Chrome Web Store — Privacy practices

Тексты для вкладки **Privacy practices** в Developer Dashboard.
Поля формы заполняются на английском — копируй значения из блоков ниже.
Русские пояснения даны для тебя, в форму их вставлять не нужно.

---

## Single purpose (Назначение расширения)

> Twitch Chat Translator translates Twitch chat messages into the user's
> chosen language in real time, and can translate the user's own outgoing
> messages before sending. That is its single purpose.

*RU: единственное назначение — перевод сообщений чата Twitch (входящих и
исходящих) в реальном времени.*

---

## Permission justifications (Обоснование разрешений)

### `storage`
> Used to save the user's settings locally: target language, interface
> language, selected translation provider, the user's optional API key, and
> the last detected chat language. No data is sent to the developer; it is
> stored only in the browser via chrome.storage.

*RU: хранение настроек пользователя локально в браузере (язык перевода, язык
интерфейса, провайдер, опциональный API-ключ, последний определённый язык
чата). Разработчику ничего не передаётся.*

### Host permission — `https://*.twitch.tv/*`
> The content script runs on Twitch pages to read newly posted chat messages
> and replace their text with the translation in place. The extension only
> acts on twitch.tv.

*RU: контент-скрипт работает на страницах Twitch — читает новые сообщения чата
и заменяет их текст переводом.*

### Host permissions — translation endpoints
`https://translate.googleapis.com/*`, `https://translation.googleapis.com/*`,
`https://api.deepl.com/*`, `https://api-free.deepl.com/*`

> The extension sends the text to be translated to the translation provider
> the user selects (Google or DeepL) and receives the translated text back.
> No other data is transmitted to these endpoints.

*RU: отправка текста на перевод выбранному провайдеру (Google/DeepL) и получение
перевода. Ничего, кроме переводимого текста, не передаётся.*

### Remote code
> The extension does NOT use remote code. All JavaScript is bundled in the
> package. Network requests are made only to translation APIs and return data
> (translated text), not executable code.

*RU: удалённый код не используется. Весь JS — в пакете; запросы идут только к
API перевода и возвращают данные, а не исполняемый код.*

---

## Data usage (Использование данных)

В разделе **Data collection** отметь категории. Реальное положение дел:

- **Не собирается и не передаётся разработчику** никаких данных. У расширения
  нет своего сервера и аналитики.
- Текст сообщений чата передаётся **третьей стороне — провайдеру перевода**
  (Google или DeepL), который выбрал пользователь, исключительно для выполнения
  перевода. Это раскрыто в Privacy policy.

Чекбоксы-сертификации (нужно отметить все три):

- [x] I do not sell or transfer user data to third parties, outside of the
      approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to
      my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for
      lending purposes.

> Примечание про категории «Data collected»: формально расширение **не собирает**
> персональные данные. Текст сообщений уходит к провайдеру перевода как часть
> работы сервиса, но не хранится и не собирается расширением. Если форма требует
> отметить категорию — наиболее близкое: «Website content» (передаётся
> провайдеру перевода для предоставления функции, не для иных целей).

---

## Privacy policy URL

В поле **Privacy policy URL** нужен публичный URL. Размести файл
`privacy-policy.md` (или его HTML-версию) на любом публичном ресурсе
(GitHub Pages, gist, свой сайт) и вставь ссылку сюда.

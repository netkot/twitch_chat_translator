# Privacy Policy — Twitch Chat Translator

_Last updated: 2026-06-28_

Twitch Chat Translator ("the extension") is a browser extension that translates
Twitch chat messages in real time. This policy explains what data the extension
handles and how.

## What the extension does

- Reads chat messages displayed on twitch.tv and replaces their text with a
  translation in place.
- Optionally translates the messages you type before you send them.
- Stores your settings (target language, interface language, translation
  provider, optional API key, last detected chat language) locally in your
  browser.

## Data we collect

**None.** The developer does not collect, store, sell, or transmit any of your
data. The extension has no backend server and no analytics or tracking.

## Data sent to third parties

To perform a translation, the text to be translated is sent to the translation
provider **you choose** in the settings:

- **Google Translate** (`translate.googleapis.com`) — default, no key required.
- **Google Cloud Translation** (`translation.googleapis.com`) — requires your
  own API key.
- **DeepL** (`api.deepl.com` / `api-free.deepl.com`) — requires your own API key.

Only the text being translated is sent. The processing of that text is governed
by the privacy policy of the provider you select:

- Google: https://policies.google.com/privacy
- DeepL: https://www.deepl.com/privacy

The extension does not send your data anywhere else.

## Local storage

Your settings and any API key you enter are stored locally in your browser using
the `chrome.storage` API. If Chrome sync is enabled, Chrome may sync these
settings across your devices under your Google account. The developer has no
access to this data.

## Permissions

- `storage` — to save your settings locally.
- Access to `twitch.tv` — to read and translate chat messages on the page.
- Access to the translation provider endpoints listed above — to request
  translations.

## Remote code

The extension does not load or execute remote code. All code ships inside the
extension package.

## Children's privacy

The extension is not directed to children and does not knowingly collect data
from anyone.

## Changes

This policy may be updated; the "Last updated" date above reflects the latest
version.

## Contact

Questions: netkot@gmail.com

---

# Политика конфиденциальности — Переводчик чата Twitch

_Обновлено: 28.06.2026_

Переводчик чата Twitch («расширение») переводит сообщения чата Twitch в реальном
времени. Документ объясняет, какие данные обрабатываются.

## Что делает расширение

- Читает сообщения чата на twitch.tv и заменяет их текст переводом на месте.
- По желанию переводит сообщения, которые вы вводите, перед отправкой.
- Хранит ваши настройки (язык перевода, язык интерфейса, провайдер, опциональный
  API-ключ, последний определённый язык чата) локально в браузере.

## Какие данные мы собираем

**Никакие.** Разработчик не собирает, не хранит, не продаёт и не передаёт ваши
данные. У расширения нет собственного сервера, аналитики и трекинга.

## Данные, передаваемые третьим сторонам

Для выполнения перевода текст отправляется провайдеру перевода, **который вы
выбираете** в настройках:

- **Google Translate** (`translate.googleapis.com`) — по умолчанию, без ключа.
- **Google Cloud Translation** (`translation.googleapis.com`) — нужен ваш ключ.
- **DeepL** (`api.deepl.com` / `api-free.deepl.com`) — нужен ваш ключ.

Передаётся только переводимый текст. Его обработка регулируется политикой
выбранного провайдера:

- Google: https://policies.google.com/privacy
- DeepL: https://www.deepl.com/privacy

Больше никуда расширение данные не отправляет.

## Локальное хранение

Настройки и введённый API-ключ хранятся локально через `chrome.storage`. Если
включена синхронизация Chrome, настройки могут синхронизироваться между вашими
устройствами в вашем аккаунте Google. Разработчик доступа к этим данным не имеет.

## Разрешения

- `storage` — сохранение настроек локально.
- Доступ к `twitch.tv` — чтение и перевод сообщений чата на странице.
- Доступ к эндпоинтам провайдеров перевода — запрос переводов.

## Удалённый код

Расширение не загружает и не исполняет удалённый код. Весь код — внутри пакета.

## Дети

Расширение не предназначено для детей и не собирает данные о них.

## Изменения

Политика может обновляться; дата вверху отражает актуальную версию.

## Контакт

Вопросы: netkot@gmail.com

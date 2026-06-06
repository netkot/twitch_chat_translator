// Service worker: выполняет переводы вне страницы (обход CORS) и кеширует
// результаты, чтобы не дёргать API на повторяющихся сообщениях.
//
// Поддерживаются три провайдера:
//   - google_free : бесплатный неофициальный endpoint (по умолчанию, без ключа)
//   - google_api  : официальный Google Cloud Translation API (нужен ключ)
//   - deepl       : DeepL API (нужен ключ; free-ключи оканчиваются на ":fx")

const CACHE_MAX = 3000;
const cache = new Map(); // key -> { text, src }

function cacheGet(key) {
  if (!cache.has(key)) return null;
  const val = cache.get(key);
  cache.delete(key); // обновляем порядок (LRU)
  cache.set(key, val);
  return val;
}

function cacheSet(key, val) {
  cache.set(key, val);
  if (cache.size > CACHE_MAX) {
    cache.delete(cache.keys().next().value); // удаляем самый старый
  }
}

// --- Провайдеры перевода ---------------------------------------------------

async function translateGoogleFree(text, target) {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx" +
    "&sl=auto&tl=" +
    encodeURIComponent(target) +
    "&dt=t&q=" +
    encodeURIComponent(text);

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("Google free HTTP " + res.status);

  const data = await res.json();
  const translated = (data[0] || []).map((seg) => seg[0]).join("");
  const src = data[2] || "auto";
  return { text: translated, src };
}

async function translateGoogleApi(text, target, key) {
  if (!key) throw new Error("Не указан ключ Google API");
  const url =
    "https://translation.googleapis.com/language/translate/v2?key=" +
    encodeURIComponent(key);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target, format: "text" }),
  });
  if (!res.ok) throw new Error("Google API HTTP " + res.status);

  const data = await res.json();
  const t = data.data.translations[0];
  return { text: t.translatedText, src: t.detectedSourceLanguage || "auto" };
}

async function translateDeepL(text, target, key) {
  if (!key) throw new Error("Не указан ключ DeepL");
  // Free-ключи оканчиваются на ":fx" и используют api-free.deepl.com
  const host = key.trim().endsWith(":fx")
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";

  const params = new URLSearchParams();
  params.append("text", text);
  params.append("target_lang", target.toUpperCase());

  const res = await fetch(host + "/v2/translate", {
    method: "POST",
    headers: {
      Authorization: "DeepL-Auth-Key " + key.trim(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!res.ok) throw new Error("DeepL HTTP " + res.status);

  const data = await res.json();
  const t = data.translations[0];
  return { text: t.text, src: (t.detected_source_language || "auto").toLowerCase() };
}

async function translate(text, target, provider, apiKey) {
  switch (provider) {
    case "google_api":
      return translateGoogleApi(text, target, apiKey);
    case "deepl":
      return translateDeepL(text, target, apiKey);
    case "google_free":
    default:
      return translateGoogleFree(text, target);
  }
}

// --- Обработчик сообщений --------------------------------------------------

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "translate") return false;

  const target = msg.target || "ru";
  const provider = msg.provider || "google_free";
  const apiKey = msg.apiKey || "";
  const text = (msg.text || "").trim();

  if (!text) {
    sendResponse({ ok: true, text: "", src: "" });
    return false;
  }

  const key = provider + "|" + target + "|" + text;
  const cached = cacheGet(key);
  if (cached) {
    sendResponse({ ok: true, text: cached.text, src: cached.src, cached: true });
    return false;
  }

  translate(text, target, provider, apiKey)
    .then((result) => {
      cacheSet(key, result);
      sendResponse({ ok: true, text: result.text, src: result.src });
    })
    .catch((err) => {
      sendResponse({ ok: false, error: String(err && err.message ? err.message : err) });
    });

  return true; // ответ асинхронный
});

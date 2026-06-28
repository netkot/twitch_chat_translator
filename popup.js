// Логика всплывающего окна: чтение и сохранение настроек в chrome.storage.sync.

const DEFAULTS = {
  enabled: true,
  target: "ru",
  provider: "google_free",
  apiKey: "",
  translateOutgoing: true,
  outgoingTarget: "auto",
  uiLang: "auto", // "auto" = язык браузера, иначе код языка интерфейса
};

const I18N = window.TCT_I18N;

// Человекочитаемые названия для отображения определённого языка чата.
const LANG_NAMES = {
  ru: "Русский",
  en: "English",
  uk: "Українська",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  pt: "Português",
  pl: "Polski",
  tr: "Türkçe",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  it: "Italiano",
  nl: "Nederlands",
  ar: "العربية",
};

const els = {
  uiLang: document.getElementById("uiLang"),
  enabled: document.getElementById("enabled"),
  translateOutgoing: document.getElementById("translateOutgoing"),
  outgoingTarget: document.getElementById("outgoingTarget"),
  target: document.getElementById("target"),
  provider: document.getElementById("provider"),
  apiKey: document.getElementById("apiKey"),
  keyRow: document.getElementById("keyRow"),
  detected: document.getElementById("detected"),
  status: document.getElementById("status"),
};

let uiLang = I18N.resolveLang("auto"); // активный язык интерфейса (реальный код)
let lastDetectedCode = ""; // код определённого языка чата (для перерисовки)

// Заполняем селектор языков интерфейса (после авто-опции из HTML).
for (const [code, name] of Object.entries(I18N.UI_LANGS)) {
  const opt = document.createElement("option");
  opt.value = code;
  opt.textContent = name;
  els.uiLang.appendChild(opt);
}

// Применяет переводы ко всем размеченным элементам попапа.
function applyI18n() {
  document.documentElement.lang = uiLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = I18N.t(uiLang, el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = I18N.t(uiLang, el.getAttribute("data-i18n-html"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = I18N.t(uiLang, el.getAttribute("data-i18n-placeholder"));
  });
  showDetected(lastDetectedCode);
}

let statusTimer = null;
function flash(text) {
  els.status.textContent = text;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => (els.status.textContent = ""), 1500);
}

function updateKeyVisibility() {
  els.keyRow.hidden = els.provider.value === "google_free";
}

function save() {
  const data = {
    uiLang: els.uiLang.value,
    enabled: els.enabled.checked,
    translateOutgoing: els.translateOutgoing.checked,
    outgoingTarget: els.outgoingTarget.value,
    target: els.target.value,
    provider: els.provider.value,
    apiKey: els.apiKey.value.trim(),
  };
  chrome.storage.sync.set(data, () => flash(I18N.t(uiLang, "saved")));
}

function showDetected(code) {
  lastDetectedCode = code || "";
  const prefix = I18N.t(uiLang, "chatLangPrefix");
  if (code) {
    els.detected.textContent = prefix + (LANG_NAMES[code] || code);
  } else {
    els.detected.textContent = prefix + I18N.t(uiLang, "notDetected");
  }
}

// Загрузка текущих значений.
chrome.storage.sync.get(DEFAULTS, (s) => {
  els.uiLang.value = s.uiLang;
  uiLang = I18N.resolveLang(s.uiLang);
  els.enabled.checked = s.enabled;
  els.translateOutgoing.checked = s.translateOutgoing;
  els.outgoingTarget.value = s.outgoingTarget;
  els.target.value = s.target;
  els.provider.value = s.provider;
  els.apiKey.value = s.apiKey || "";
  updateKeyVisibility();
  applyI18n();
});

// Определённый язык чата хранится в storage.local (его пишет content script).
chrome.storage.local.get({ detectedLang: "" }, (s) => showDetected(s.detectedLang));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.detectedLang) {
    showDetected(changes.detectedLang.newValue);
  }
});

// Сохраняем при любом изменении.
els.uiLang.addEventListener("change", () => {
  uiLang = I18N.resolveLang(els.uiLang.value);
  applyI18n();
  save();
});
els.enabled.addEventListener("change", save);
els.translateOutgoing.addEventListener("change", save);
els.outgoingTarget.addEventListener("change", save);
els.target.addEventListener("change", save);
els.provider.addEventListener("change", () => {
  updateKeyVisibility();
  save();
});
els.apiKey.addEventListener("input", save);

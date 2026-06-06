// Логика всплывающего окна: чтение и сохранение настроек в chrome.storage.sync.

const DEFAULTS = {
  enabled: true,
  target: "ru",
  provider: "google_free",
  apiKey: "",
  translateOutgoing: true,
  outgoingTarget: "auto",
};

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
    enabled: els.enabled.checked,
    translateOutgoing: els.translateOutgoing.checked,
    outgoingTarget: els.outgoingTarget.value,
    target: els.target.value,
    provider: els.provider.value,
    apiKey: els.apiKey.value.trim(),
  };
  chrome.storage.sync.set(data, () => flash("Сохранено"));
}

function showDetected(code) {
  if (code) {
    els.detected.textContent = "Язык чата: " + (LANG_NAMES[code] || code);
  } else {
    els.detected.textContent = "Язык чата: не определён";
  }
}

// Загрузка текущих значений.
chrome.storage.sync.get(DEFAULTS, (s) => {
  els.enabled.checked = s.enabled;
  els.translateOutgoing.checked = s.translateOutgoing;
  els.outgoingTarget.value = s.outgoingTarget;
  els.target.value = s.target;
  els.provider.value = s.provider;
  els.apiKey.value = s.apiKey || "";
  updateKeyVisibility();
});

// Определённый язык чата хранится в storage.local (его пишет content script).
chrome.storage.local.get({ detectedLang: "" }, (s) => showDetected(s.detectedLang));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.detectedLang) {
    showDetected(changes.detectedLang.newValue);
  }
});

// Сохраняем при любом изменении.
els.enabled.addEventListener("change", save);
els.translateOutgoing.addEventListener("change", save);
els.outgoingTarget.addEventListener("change", save);
els.target.addEventListener("change", save);
els.provider.addEventListener("change", () => {
  updateKeyVisibility();
  save();
});
els.apiKey.addEventListener("input", save);

// Content script: следит за чатом Twitch и заменяет текст каждого нового
// сообщения его переводом. Дополнительно определяет доминирующий язык чата
// (по входящим сообщениям) и переводит ИСХОДЯЩИЕ сообщения пользователя в этот
// язык перед отправкой.
//
// Поддерживаются два рендерера чата:
//   1. Нативный Twitch  (.chat-line__message / .text-fragment)
//   2. 7TV ("new chat") (.seventv-user-message / .text-token)
// 7TV полностью заменяет нативную разметку на свою (Vue), поэтому нужны оба
// набора селекторов. Эмоуты/упоминания/ссылки 7TV (.emote-token,
// .mention-token, .link-part) мы НЕ трогаем — заменяем только текстовые токены.

// Защита от повторной инъекции: если контент-скрипт уже выполнялся в этом
// фрейме (например, после перезагрузки расширения при открытой вкладке Twitch),
// второй запуск иначе вызвал бы «Identifier has already been declared».
if (window.__TCT_INJECTED__) {
  // уже загружено — ничего не делаем
} else {
  window.__TCT_INJECTED__ = true;
  init();
}

function init() {
  "use strict";

  const DEFAULTS = {
    enabled: true,
    target: "ru",
    provider: "google_free",
    apiKey: "",
    skipShort: true,
    translateOutgoing: true, // автоматически переводить мои сообщения при Enter
    outgoingTarget: "auto", // "auto" = язык чата, либо код языка (en, ru, ...)
  };

  let settings = { ...DEFAULTS };

  const PROCESSED = "data-tct-done"; // ставится на элемент-тело сообщения

  // Селекторы обоих рендереров (нативный + 7TV).
  const MESSAGE_SELECTOR = [
    ".chat-line__message",
    ".vod-message",
    ".user-notice-line",
    ".seventv-user-message", // 7TV: элемент, содержащий тело сообщения
    ".seventv-message", // 7TV: внешняя обёртка v-for (тело монтируется позже)
  ].join(",");

  const BODY_SELECTOR = [
    '[data-a-target="chat-line-message-body"]',
    ".seventv-chat-message-body",
  ].join(",");

  const TEXT_FRAGMENT_SELECTOR = [
    ".text-fragment",
    '[data-a-target="chat-message-text"]',
    ".text-token", // 7TV текстовый токен
  ].join(",");

  const CONTAINER_SELECTORS = [
    ".seventv-chat-list", // 7TV (приоритетно, если активно)
    ".chat-scrollable-area__message-container",
    '[data-a-target="chat-scroller"]',
    '[role="log"]',
  ];

  // --- Очередь переводов с ограничением параллелизма ----------------------

  const MAX_CONCURRENT = 4;
  let active = 0;
  const queue = [];

  function enqueue(job) {
    queue.push(job);
    pump();
  }

  function pump() {
    while (active < MAX_CONCURRENT && queue.length) {
      const job = queue.shift();
      active++;
      job().finally(() => {
        active--;
        pump();
      });
    }
  }

  function requestTranslation(text, target) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "translate",
          text,
          target: target || settings.target,
          provider: settings.provider,
          apiKey: settings.apiKey,
        },
        (resp) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(resp || { ok: false, error: "no response" });
          }
        }
      );
    });
  }

  // --- Определение языка чата --------------------------------------------
  // Подсчитываем, на каком языке приходят сообщения. Доминирующий язык —
  // это «язык чата», в который мы переводим исходящие сообщения.

  const langCounts = new Map();
  let chatLang = null;

  function recordLang(src) {
    if (!src || src === "auto") return;
    src = String(src).toLowerCase().split("-")[0]; // "en-US" -> "en"
    langCounts.set(src, (langCounts.get(src) || 0) + 1);

    let best = chatLang;
    let bestN = -1;
    for (const [lang, n] of langCounts) {
      if (n > bestN) {
        bestN = n;
        best = lang;
      }
    }
    if (best !== chatLang) {
      chatLang = best;
      try {
        chrome.storage.local.set({ detectedLang: chatLang }); // для попапа
      } catch (e) {
        /* контекст расширения мог быть выгружен */
      }
    }
  }

  function resetLangDetection() {
    langCounts.clear();
    chatLang = null;
    try {
      chrome.storage.local.set({ detectedLang: "" });
    } catch (e) {
      /* noop */
    }
  }

  // --- Обработка одного сообщения ----------------------------------------

  function processMessage(msgEl) {
    if (!msgEl || msgEl.nodeType !== 1) return;

    // Тело сообщения может быть внутри переданного элемента (нативный чат и
    // 7TV .seventv-user-message) либо самим элементом.
    const body =
      (msgEl.matches && msgEl.matches(BODY_SELECTOR) && msgEl) ||
      msgEl.querySelector(BODY_SELECTOR);

    // У 7TV обёртка .seventv-message появляется раньше, чем монтируется тело.
    // В этом случае ничего не помечаем — наблюдатель/периодический скан
    // обработают сообщение, когда Vue его отрисует.
    if (!body) return;
    if (body.getAttribute(PROCESSED)) return;
    body.setAttribute(PROCESSED, "1"); // тело найдено — решение принимаем сейчас

    const textEls = Array.from(body.querySelectorAll(TEXT_FRAGMENT_SELECTOR));

    let targets = textEls;
    if (targets.length === 0) {
      // Нет распознанных текстовых токенов. Заменяем тело целиком ТОЛЬКО если
      // в нём нет дочерних элементов (чистый текст) — иначе можно затереть
      // эмоуты/упоминания.
      if (body.children.length === 0 && body.textContent.trim()) {
        targets = [body];
      } else {
        return;
      }
    }

    const original = targets.map((el) => el.textContent).join("").trim();
    if (!original) return;
    if (settings.skipShort && original.length < 2) return;
    if (!/\p{L}/u.test(original)) return; // нет букв (эмодзи/цифры/символы)

    enqueue(() =>
      requestTranslation(original).then((resp) => {
        if (!resp || !resp.ok) return;
        recordLang(resp.src); // учитываем язык сообщения для определения языка чата
        if (!resp.text) return;
        const translated = resp.text;
        if (translated.trim() === original.trim()) return; // уже на нужном языке

        // Весь перевод кладём в первый текстовый токен, остальные очищаем —
        // позиции эмоутов/упоминаний между токенами сохраняются.
        targets[0].textContent = translated;
        for (let i = 1; i < targets.length; i++) targets[i].textContent = "";
      })
    );
  }

  function scan(root) {
    if (!settings.enabled || !root || !root.querySelectorAll) return;
    root.querySelectorAll(MESSAGE_SELECTOR).forEach(processMessage);
  }

  // --- Наблюдение за чатом (с учётом SPA-навигации Twitch) ----------------

  let observer = null;
  let attachedContainer = null;

  function findContainer() {
    for (const sel of CONTAINER_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function attach() {
    const container = findContainer();
    // Контейнер мог быть пересоздан (смена канала или переключение
    // нативный↔7TV чат) — переподключаемся, если он исчез из DOM или сменился.
    if (
      attachedContainer &&
      attachedContainer.isConnected &&
      (!container || container === attachedContainer)
    ) {
      return;
    }
    if (!container) return;

    if (observer) observer.disconnect();
    attachedContainer = container;
    resetLangDetection(); // новый канал — определяем язык заново

    observer = new MutationObserver((mutations) => {
      if (!settings.enabled) return;
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(MESSAGE_SELECTOR)) {
            processMessage(node);
          }
          // Вне зависимости от совпадения — ищем сообщения внутри (например,
          // 7TV монтирует тело внутрь обёртки .seventv-message позже).
          scan(node);
        });
      }
    });

    observer.observe(container, { childList: true, subtree: true });
    scan(container); // обработать уже видимые сообщения
  }

  // Twitch — SPA: контейнер пересоздаётся при смене канала или переключении
  // между нативным чатом и 7TV. Периодически проверяем подключение и
  // подчищаем сообщения, которые могли «проскочить» мимо наблюдателя
  // (например, из-за асинхронного монтирования Vue в 7TV).
  setInterval(() => {
    attach();
    if (attachedContainer && attachedContainer.isConnected) scan(attachedContainer);
  }, 1500);
  attach();

  // --- Перевод исходящих сообщений ---------------------------------------
  // Два режима:
  //   1) Ручной (надёжный): Ctrl+Enter — переводит текст ПРЯМО в поле ввода и
  //      заменяет его. Ничего не отправляет — вы проверяете и жмёте Enter сами.
  //   2) Авто: при обычном Enter переводит и сразу отправляет (тумблер
  //      «Переводить мои сообщения», может работать нестабильно с редактором
  //      Twitch — поэтому рекомендуется ручной режим).
  // Поддерживается нативное поле Twitch (Slate/contenteditable) и textarea.

  const INPUT_SELECTOR = [
    '[data-a-target="chat-input"]',
    ".chat-wysiwyg-input__editor",
    'div[data-slate-editor="true"]',
    ".chat-input textarea",
    ".seventv-chat-input",
  ].join(",");

  const SEND_BUTTON_SELECTOR = '[data-a-target="chat-send-button"]';

  let programmaticSend = false; // флаг нашего собственного нажатия Enter

  // Из совпавшего по селектору элемента достаём настоящее редактируемое поле.
  function resolveEditable(el) {
    if (!el) return null;
    if (el.tagName === "TEXTAREA" || el.isContentEditable) return el;
    return el.querySelector('textarea, [contenteditable="true"]') || el;
  }

  function findEditableFrom(target) {
    const box = target && target.closest && target.closest(INPUT_SELECTOR);
    return resolveEditable(box || target);
  }

  function readInput(input) {
    return (input.tagName === "TEXTAREA" ? input.value : input.textContent) || "";
  }

  // Детерминированно выделяет всё содержимое поля. Это меняет DOM-выделение и
  // порождает selectionchange, по которому Slate синхронизирует выделение в
  // своей модели (нужно подождать тик до paste, иначе перевод допишется в конец).
  function selectAll(input) {
    input.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(input);
    sel.addRange(range);
  }

  // Имитирует вставку текста. Slate перехватывает paste, кладёт текст в свою
  // МОДЕЛЬ (а не только в DOM) и вызывает preventDefault — поэтому отправляется
  // именно переведённый текст и не ломается редактирование. Возвращает true,
  // если событие было обработано (отменено) редактором.
  function pasteText(input, text) {
    try {
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      const ev = new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      });
      const notCancelled = input.dispatchEvent(ev);
      return !notCancelled; // редактор вызвал preventDefault → обработал
    } catch (e) {
      return false;
    }
  }

  function insertReplacing(input, text) {
    // Выделение уже стоит на всём содержимом и синхронизировано с моделью.
    if (pasteText(input, text)) return; // Slate обработал — модель синхронна
    // Запасной путь для обычного contenteditable (без перехвата paste):
    if (document.execCommand("insertText", false, text)) return;
    input.textContent = text;
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: text }));
  }

  // Заменяет текст поля переводом. Возвращает Promise, чтобы отправлять строго
  // ПОСЛЕ завершения вставки.
  function setInputText(input, text) {
    input.focus();
    if (input.tagName === "TEXTAREA") {
      // Меняем значение через нативный сеттер, чтобы React заметил изменение.
      const desc = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(input),
        "value"
      );
      if (desc && desc.set) desc.set.call(input, text);
      else input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return Promise.resolve();
    }

    // contenteditable / Slate: выделяем всё, ждём синхронизации выделения в
    // модели Slate, затем вставляем поверх выделения (paste заменяет его).
    selectAll(input);
    return new Promise((resolve) => {
      setTimeout(() => {
        insertReplacing(input, text);
        resolve();
      }, 40);
    });
  }

  // Язык, в который переводим исходящие: явный выбор или язык чата (auto).
  function outgoingTarget() {
    const t = settings.outgoingTarget || "auto";
    return t === "auto" ? chatLang : t;
  }

  function sendMessage(input) {
    const btn = document.querySelector(SEND_BUTTON_SELECTOR);
    if (btn && !btn.disabled) {
      btn.click();
      return;
    }
    // Запасной вариант — синтетический Enter.
    programmaticSend = true;
    const opt = {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    };
    input.dispatchEvent(new KeyboardEvent("keydown", opt));
    input.dispatchEvent(new KeyboardEvent("keyup", opt));
    setTimeout(() => (programmaticSend = false), 50);
  }

  // Переводит текущий текст поля ввода и заменяет его. send=true — ещё и
  // отправляет. Возвращает true, если перевод был запущен.
  function translateInput(input, send) {
    const target = outgoingTarget();
    if (!target) return false; // язык назначения неизвестен
    const text = readInput(input).trim();
    if (!text || text.startsWith("/") || !/\p{L}/u.test(text)) return false;

    requestTranslation(text, target).then((resp) => {
      const out = resp && resp.ok && resp.text ? resp.text : text;
      setInputText(input, out).then(() => {
        // Отправляем строго после вставки + даём React обновить состояние.
        if (send) setTimeout(() => sendMessage(input), 120);
      });
    });
    return true;
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (programmaticSend) return; // наша же отправка — пропускаем
      if (!settings.enabled) return;
      if (e.key !== "Enter" || e.shiftKey || e.altKey || e.metaKey || e.isComposing) {
        return;
      }

      const input = findEditableFrom(e.target);
      if (!input) return;

      // Ctrl+Enter — ручной перевод в поле без отправки.
      if (e.ctrlKey) {
        if (translateInput(input, false)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }

      // Обычный Enter — авто-режим: перевести и отправить.
      if (!settings.translateOutgoing) return;
      if (translateInput(input, true)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true // capture: перехватываем раньше обработчиков Twitch
  );

  // --- Настройки ----------------------------------------------------------

  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = { ...DEFAULTS, ...stored };
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const k in changes) {
      settings[k] = changes[k].newValue;
    }
  });
}

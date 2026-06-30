#!/usr/bin/env python3
"""Сборка zip-пакета расширения для публикации в Chrome Web Store.

Исходники в репозитории остаются с комментариями; в пакет попадают копии,
из которых комментарии удалены:
  - JS  — через terser (полноценный парсер, не ломает строки/regex-литералы);
  - CSS — стриппер /* */ с учётом строковых литералов;
  - HTML — удаление <!-- ... --> (вне <script>/<style>).

Запуск:  python build.py
Требует: node + npx (terser ставится через `npx --yes terser`).
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))

# Файлы, попадающие в пакет (dev-файлы — README, ICONS.md, build.py, store/,
# docs/, .git — сюда не входят).
JS_FILES = ["background.js", "content.js", "i18n.js", "popup.js"]
CSS_FILES = ["content.css", "popup.css"]
HTML_FILES = ["popup.html"]
COPY_FILES = ["manifest.json"]
COPY_DIRS = ["_locales"]
ICON_FILES = ["icons/icon16.png", "icons/icon48.png", "icons/icon128.png"]


def strip_js(src_path, dst_path):
    """Удаляет комментарии из JS через terser (без манглинга/компрессии)."""
    cmd = [
        "npx", "--yes", "terser", src_path,
        "--format", "beautify=true,comments=false",
        "-o", dst_path,
    ]
    subprocess.run(cmd, check=True, shell=(os.name == "nt"))


def strip_css(text):
    """Удаляет /* */ комментарии, не трогая содержимое строк '...' и \"...\"."""
    out = []
    i, n = 0, len(text)
    quote = None
    while i < n:
        c = text[i]
        if quote:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1]); i += 2; continue
            if c == quote:
                quote = None
            i += 1; continue
        if c in "\"'":
            quote = c; out.append(c); i += 1; continue
        if c == "/" and i + 1 < n and text[i + 1] == "*":
            j = text.find("*/", i + 2)
            i = n if j == -1 else j + 2
            continue
        out.append(c); i += 1
    # схлопываем пустые строки, оставшиеся от вырезанных комментариев
    return re.sub(r"\n[ \t]*\n", "\n", "".join(out))


def strip_html(text):
    """Удаляет HTML-комментарии <!-- ... -->."""
    return re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)


def main():
    manifest = json.load(open(os.path.join(ROOT, "manifest.json"), encoding="utf-8"))
    version = manifest["version"]
    out_zip = os.path.join(ROOT, f"twitch-chat-translator-v{version}.zip")

    stage = tempfile.mkdtemp(prefix="tct-build-")
    try:
        for f in JS_FILES:
            strip_js(os.path.join(ROOT, f), os.path.join(stage, f))

        for f in CSS_FILES:
            text = open(os.path.join(ROOT, f), encoding="utf-8").read()
            open(os.path.join(stage, f), "w", encoding="utf-8").write(strip_css(text))

        for f in HTML_FILES:
            text = open(os.path.join(ROOT, f), encoding="utf-8").read()
            open(os.path.join(stage, f), "w", encoding="utf-8").write(strip_html(text))

        for f in COPY_FILES + ICON_FILES:
            dst = os.path.join(stage, f)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(ROOT, f), dst)

        for d in COPY_DIRS:
            shutil.copytree(os.path.join(ROOT, d), os.path.join(stage, d))

        if os.path.exists(out_zip):
            os.remove(out_zip)
        with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
            for root, _, files in os.walk(stage):
                for name in files:
                    p = os.path.join(root, name)
                    z.write(p, os.path.relpath(p, stage).replace("\\", "/"))

        print(f"Built {os.path.basename(out_zip)} (v{version}, comments stripped)")
        with zipfile.ZipFile(out_zip) as z:
            for n in sorted(z.namelist()):
                print("  ", n)
    finally:
        shutil.rmtree(stage, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())

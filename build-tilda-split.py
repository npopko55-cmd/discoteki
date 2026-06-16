#!/usr/bin/env python3
"""
Сборка блоков T123 для walk-walk.ru/discoteki.

Tilda T123 — лимит ~30 000 символов на блок. Кириллица в T123 часто рендерится
как mojibake → вся не-ASCII кодируется в HTML-сущности &#NNNN; (раздувает ~1.85×).
Поэтому HTML режется на несколько блоков.

CSS и JS — внешние ссылки на GitHub Pages (в блоки не инлайнятся).
assets/ → абсолютные URL на CDN.
Kinescope-iframe и GetCourse-<script> сохраняются как есть (ASCII, encoding их не трогает).

Структура блоков:
- Блок 1: head-хинты + header + hero + unique + filling
- Блок 2: coaches + rates + cases + final-cta + footer
- Блок 3: все попапы (видео Kinescope + GetCourse-виджеты) + sticky-cta + back-to-top + <script>
  (попапы position:fixed — место в DOM не важно, изолируем их со скриптами оплаты)
"""
import re
from pathlib import Path

BASE = Path(__file__).parent
CDN = "https://npopko55-cmd.github.io/discoteki"
VER = "disco-AC"

html = (BASE / "index.html").read_text(encoding="utf-8")
body = re.search(r"<body[^>]*>(.*?)</body>", html, re.DOTALL).group(1)

# --- 1. Чистим комментарии и абсолютизируем assets ---
body = re.sub(r"<!--.*?-->", "", body, flags=re.DOTALL)
body = re.sub(r'(href|src)="(assets/[^"]+)"', lambda m: f'{m.group(1)}="{CDN}/{m.group(2)}"', body)
body = re.sub(r"url\((['\"])(assets/[^'\")]+)\1\)", lambda m: f"url({m.group(1)}{CDN}/{m.group(2)}{m.group(1)})", body)
body = re.sub(r"url\((assets/[^'\")]+)\)", lambda m: f"url({CDN}/{m.group(1)})", body)

# --- 2. Границы секций (RAW, до encoding) ---
def pos(patt):
    m = re.search(patt, body)
    if not m:
        raise SystemExit(f"Не нашёл: {patt}")
    return m.start()

p_coaches = pos(r'<section class="section coaches"')
p_popups  = pos(r'<div class="popup popup--video"[^>]*id="popup-video-nastya"')

part_a = body[:p_coaches]          # header + hero + unique + filling
part_b = body[p_coaches:p_popups]  # coaches + rates + cases + final-cta + footer
tail   = body[p_popups:]           # попапы + sticky + back-to-top

# --- 3. Анти-mojibake: вся не-ASCII → &#NNNN; ---
def to_entities(text: str) -> str:
    return "".join(c if ord(c) < 128 else f"&#{ord(c)};" for c in text)

part_a = to_entities(part_a)
part_b = to_entities(part_b)
tail   = to_entities(tail)

# --- 4. Head-хинты для блока 1 ---
HEAD_HINTS = f"""<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://npopko55-cmd.github.io" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600&family=Inter:wght@400;500;600&display=swap&subset=latin,cyrillic" rel="stylesheet" />
<link rel="preload" as="image" href="{CDN}/assets/hero/hero-disco.webp" fetchpriority="high" />
<link rel="stylesheet" href="{CDN}/styles.css?v={VER}" />
"""

TAIL_SCRIPT = f'\n<script src="{CDN}/script.js?v={VER}"></script>\n'

# --- 5. Сборка ---
block1 = HEAD_HINTS + "\n" + part_a + "\n"
block2 = part_b
block3 = tail + TAIL_SCRIPT

(BASE / "tilda-block-1.html").write_text(block1, encoding="utf-8")
(BASE / "tilda-block-2.html").write_text(block2, encoding="utf-8")
(BASE / "tilda-block-3.html").write_text(block3, encoding="utf-8")

# --- 6. Отчёт ---
def sz(s):
    n = len(s)
    ok = "✓ помещается" if n < 30000 else "✗ ПРЕВЫШЕН ЛИМИТ 30000"
    return f"{n:,} chars ({n/1024:.1f} KB)  {ok}"

print("✅ Готово")
print(f"   tilda-block-1.html: {sz(block1)}")
print(f"   tilda-block-2.html: {sz(block2)}")
print(f"   tilda-block-3.html: {sz(block3)}")
print(f"   Лимит Tilda T123:   30 000 chars / блок")
print()
print("   Блок 1: head-хинты + header + hero + unique + filling")
print("   Блок 2: coaches + rates(тарифы) + cases + final-cta + footer")
print("   Блок 3: попапы (Kinescope-видео + GetCourse-виджеты) + sticky + back-to-top + script")
print()
print("   • Кириллица → HTML-сущности (&#NNNN;) — лечит mojibake в Tilda.")
print("   • CSS/JS — с GitHub Pages, не инлайнятся.")
print("   • Kinescope-iframe и GetCourse-script сохранены как есть.")

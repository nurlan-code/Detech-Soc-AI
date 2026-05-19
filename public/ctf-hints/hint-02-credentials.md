# Challenge 2 — Information Disclosure in JS Source (Orta)

## Məqsəd
JavaScript bundle-larına qarışmış base64 şifrəli credentials-ları tapmaq.

## Həll yolu
**Metod A — Source Maps vasitəsilə (Challenge 6 aktivdirsə):**
1. F12 → Sources tab → webpack bölməsi
2. `lib/utils/internal/legacy/config-backup.ts` faylını tap
3. Şərh satırlarındakı base64 stringləri decode et

**Metod B — JS bundle-ların manual analizi:**
1. `/_next/static/chunks/*.js` fayllarını yüklə
2. `aW50ZXJuYWwt` və ya `base64` açar sözlərini axtar
3. Tapılan stringləri decode et

## Base64 → Plaintext
```
aW50ZXJuYWwtZGI6Ly9jdGZfdXNlcjpDVEZfcGFzc18yMDI0IUBkYi5leGFtcGxlLWN0Zi5jb206NTQzMi9jdGZfZGI=
→ internal-db://ctf_user:CTF_pass_2024!@db.example-ctf.com:5432/ctf_db

c2stY3RmLVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWA==
→ sk-ctf-XXXXXXXXXXXXXXXXXXXXXXXXXXXX

Y3RmX2FkbWluQGRldGVjaC5pbzpDVEZwYXNzd29yZDEyMyE=
→ ctf_admin@detech.io:CTFpassword123!
```

## Zəiflik yeri
`lib/utils/internal/legacy/config-backup.ts` — şərh sətirləri

## CTF Flag
`CTF{base64_is_not_encryption_info_disclosure}`

## Real dünya analoquu
OWASP Top 10: A02:2021 — Cryptographic Failures
Base64 kriptoqrafik qorunma deyil — sadəcə encoding-dir.

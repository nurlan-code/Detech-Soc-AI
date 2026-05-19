# Challenge 4 — Simulated Exposed .git Directory (Çətin)

## Məqsəd
Açıq qalan `.git` qovluğunu kəşf edib məlumat əldə etmək.

## Həll yolu
**Manual yoxlama:**
```
https://[site-url]/.git/HEAD
https://[site-url]/.git/config
https://[site-url]/.git/COMMIT_EDITMSG
```

**git-dumper ilə (tam skan):**
```bash
pip install git-dumper
git-dumper https://[site-url]/.git/ ./dumped-repo
cd dumped-repo
git log --oneline
```

**Tapılan məlumatlar:**
- Remote URL: `https://github.com/detech-internal/soc-platform-private.git`
  (privat repo — internal kod bazasına işarə edir)
- Commit mesajı: `fix: removed hardcoded credentials from config-backup.ts`
  → "hardcoded credentials" dediyindən credentials əvvəl kodda mövcud olub

## Birləşdirmə
Bu challenge Challenge 2 ilə birlikdə oxunmalıdır:
commit mesajı → credentials faylda axtarmağa işarə → Challenge 2 həll olunur.

## Zəiflik yeri
`public/.git/` — Next.js `public/` qovluğu statik fayllara birbaşa giriş verir

## CTF Flag
`CTF{exposed_git_directory_recon}`

## Real dünya analoquu
OWASP Top 10: A05:2021 — Security Misconfiguration
`.git` qovluğunu web root-dan kənarda saxlamaq lazımdır.
Nginx/Apache-da `.git` üçün 403 qayıdan rule əlavə etmək lazımdır.

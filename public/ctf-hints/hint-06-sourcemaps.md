# Challenge 6 — Production Source Map Exposure (Asan — Açar)

## Məqsəd
Açıq qalan source map-lar vasitəsilə minified kodun arxasındakı orijinal TypeScript mənbəyini oxumaq.

## Həll yolu
1. Sayta daxil ol, F12 aç
2. **Sources** tab-ına keç
3. Sol paneldə `webpack://` bölməsini genişləndir
4. `lib/utils/internal/legacy/config-backup.ts` faylını tap
5. Şərh sətirləri görünəcək — Challenge 2-nin base64 stringləri

**Alternativ — .map fayllarını birbaşa yüklə:**
```bash
# JS faylını tap
curl https://[site-url]/_next/static/chunks/main-XXX.js | grep "sourceMappingURL"
# .map URL-ni tap və yüklə
curl https://[site-url]/_next/static/chunks/main-XXX.js.map > source.map
# sources içindəki faylları parse et
cat source.map | python3 -c "import json,sys; d=json.load(sys.stdin); [print(s) for s in d['sources']]"
```

## Zəiflik yeri
`next.config.mjs` — `productionBrowserSourceMaps: true`

## CTF Flag
`CTF{source_maps_leak_internal_code_and_secrets}`

## Real dünya analoquu
OWASP Top 10: A05:2021 — Security Misconfiguration
Production build-lərdə source map-lar deactivate edilməlidir.
Əgər source map lazımdırsa, ayrıca error tracking serverinə (Sentry) göndərmək lazımdır.

## Bu challenge-ın rolu
Bu challenge digərləri üçün **köməkçi/açar** kimi çalışır:
Source maps → lib/utils/internal/legacy/config-backup.ts → Challenge 2 həll
Source maps → app/search/page.tsx → Challenge 1 tap
Source maps → /api/v1/debug comment → Challenge 5 tap

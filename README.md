# Harun Karaca

Canli demo: https://harun-karaca.onrender.com

Demo giris: `admin@demo.local / Admin123!`

Harun Karaca, Promaks/Master ERP tanitim ekranlarindan turetilmis, benzin istasyonlari icin moduler ve dogrulanabilir bir full-stack MVP'dir.

## Kapsam

- React/Vite web arayuzu
- Express + TypeScript REST API
- Prisma + SQLite veritabani
- JWT tabanli giris ve rol bazli yetkilendirme
- Mock pompa, odeme, ERP/e-donusum entegrasyon katmani
- Dashboard, satis, stok, vardiya, pompa, istasyon, rapor ve dogrulama modulleri
- e-Fatura, e-Arsiv, e-Defter, EPDK, OKC, banka mutabakati, genel muhasebe ve beyanname icin mock mali operasyon modulu

## Kurulum

Gereksinim: Node.js 20 veya uzeri.

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

- Geliştirme frontend: http://localhost:5173
- Geliştirme API: http://localhost:4000/api
- Tek servis modu icin ana link: http://localhost:4000

## Local Production Modu

Tek Node servisiyle frontend ve API'yi birlikte test etmek icin:

```bash
npm run build
npm run db:migrate
npm run db:seed
npm run start
```

- Uygulama: http://localhost:4000
- Alternatif local link: http://127.0.0.1:4000
- API health: http://127.0.0.1:4000/api/health
- External browser'da bos ekran gorursen iki linki de deneyebilirsin; login istegi production build'de ayni origin uzerinden `/api` yoluna gider.

## Demo Kullanicilari

- `admin@demo.local / Admin123!`
- `manager@demo.local / Manager123!`
- `cashier@demo.local / Cashier123!`
- `accounting@demo.local / Accounting123!`

## Test ve Dogrulama

```bash
npm test
npm run build
```

Beklenen manuel kontroller:

- Login sonrasi dashboard acilir.
- Rol bazli menuler filtrelenir.
- Satis olusturulunca tank stoku azalir.
- Mock odeme, pompa ve ERP dry-run islemleri log uretir.
- Mali Operasyonlar ekraninda e-donusum, EPDK, OKC, banka mutabakati, muhasebe fisi ve beyanname dry-run islemleri calisir.
- Dogrulama paneli sistem kontrolunu basarili dondurur.

## Gercek Entegrasyon Noktalari

`apps/api/src/integrations` altindaki mock adapterlar ileride gercek POS, pompa kontrol sistemi, tank otomasyonu, ERP, GIB/e-donusum, EPDK, OKC, banka ve beyanname servisleriyle degistirilecek sekilde soyutlandi. Kod icindeki `TODO` yorumlari production entegrasyon noktalarini isaretler.

## Public Deploy

Sabit public link icin uygulamayi Render, Railway, Fly.io veya tek Node web service destekleyen benzer bir host'a deploy edin.

## Paylasilabilir Link

`localhost`, `127.0.0.1` ve `localhost:4000` linkleri baska bilgisayarlarda acilmaz. Bu adresler her bilgisayarda sadece o bilgisayarin kendisini gosterir. Baskasina gonderilecek link icin uygulama public hostinge deploy edilmelidir.

Bu repo Render icin tek Node Web Service olarak hazirlandi. Render deploy sonrasi su formda kalici bir URL verir:

```text
https://harun-karaca-xxxx.onrender.com
```

Render ile deploy akisi:

1. Kodu bir GitHub reposuna push edin.
2. Render'da `New` > `Blueprint` veya `New` > `Web Service` secin.
3. GitHub reposunu baglayin.
4. Repodaki `render.yaml` dosyasini kullanin veya asagidaki ayarlari manuel girin.
5. Render'in verdigi `https://...onrender.com` linkini paylasin.

Not: Bu repo varsayilan olarak Render'in ucretsiz demo moduna gore ayarlandi. SQLite veritabani gecici dosya olarak kullanilir; Render restart veya redeploy sonrasi demo veri yeniden olusturulabilir ve onceki degisiklikler kalici olmayabilir. Kalici veri icin Render persistent disk veya PostgreSQL kullanin.

Onerilen ayarlar:

- Build command: `npm install && npm run build && npm run deploy:prepare && npm run deploy:seed`
- Start command: `npm run start`
- Health check path: `/api/health`

Environment variables:

- `DATABASE_URL`: Ucretsiz demo icin `file:./dev.db`.
- `JWT_SECRET`: production icin guclu ve gizli bir deger.
- `PORT`: host otomatik veriyorsa set etmeyin; uygulama env degerini okur.
- `CORS_ORIGIN`: tek domain deploy'da bos birakilabilir. Ayrik frontend domaini varsa o origin'i girin.
- `VITE_API_URL`: tek domain deploy'da bos birakilabilir. Production build `/api` kullanir.

Demo veriyi manuel sifirlamak gerekirse calistirin:

```bash
npm run deploy:seed
```

Deploy tamamlaninca host size sabit URL verir. Ornek: `https://harun-karaca-example.onrender.com`.

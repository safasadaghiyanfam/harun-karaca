# Harun Karaca Proje Anlatimi

## Proje Adi ve Kisa Tanim

Harun Karaca, akaryakit istasyonlari icin muhasebe, e-donusum, operasyon takibi ve entegrasyon hazirligi sunan web tabanli bir yazilim prototipidir. Proje; istasyon operasyonlarindan gelen satis, stok, vardiya ve pompa verilerini mali sureclerle iliskilendiren, ileride gercek POS, pompa kontrol sistemi, ERP, GIB, EPDK, OKC ve banka servisleriyle entegre edilebilecek moduler bir temel olarak tasarlanmistir.

Bu surum bir MVP/prototip olarak konumlanir. Gercek dis servis baglantilari yerine mock adapterlar kullanilir. Bu sayede ekip, entegrasyon formatlari kesinlesmeden once temel is akisini, veri modelini, yetkilendirme yapisini ve dogrulama sureclerini deneyebilir.

Canli demo: https://harun-karaca.onrender.com

Demo giris: `admin@demo.local / Admin123!`

## Problem ve Amac

Akaryakit istasyonlarinda operasyonel veri ile muhasebe ve e-donusum surecleri genellikle farkli sistemlerde takip edilir. Pompa satislari, vardiya kapanislari, stok hareketleri, banka hareketleri, OKC fisleri, e-Fatura/e-Arsiv belgeleri, EPDK raporlari ve muhasebe kayitlari arasindaki veri kopuklugu manuel is yukunu ve hata riskini artirir.

Harun Karaca projesinin amaci, bu surecleri tek bir panelde izlenebilir hale getiren, rol bazli yetkilendirme destekleyen ve entegrasyon katmani net ayrilmis bir yazilim iskeleti olusturmaktir. Prototip, hem yazilim ekibinin teknik kararlarini dogrulamak hem de ikinci asamada gercek istasyon entegrasyonlari icin ortak bir temel saglamak uzere gelistirilmistir.

## Hedef Kullanicilar

- Sistem yoneticisi: kullanici, rol, istasyon ve temel konfigurasyonlari yonetir.
- Istasyon muduru: satis, stok, vardiya ve rapor ekranlarini takip eder.
- Kasa/vardiya kullanicisi: vardiya acma/kapama ve satis sureclerini yurutur.
- Stok sorumlusu: tank seviyeleri ve stok hareketlerini izler.
- Muhasebe kullanicisi: mali belgeler, muhasebe fisleri, banka mutabakati ve beyanname taslaklarini kontrol eder.
- Teknik/entegrasyon kullanicisi: mock servis testleri, dry-run kontrolleri ve entegrasyon loglarini inceler.

## Mevcut Moduller

### Dashboard

Dashboard, istasyon operasyonlari ve mali surecler icin ozet metrikler sunar. Pompa durumu, tank/stok bilgileri, satis ozeti ve mali operasyon kartlari tek ekranda gorulebilir.

### Kullanici Girisi ve Rol Yonetimi

Sistem JWT tabanli giris yapisi kullanir. Roller `ADMIN`, `MANAGER`, `CASHIER`, `INVENTORY`, `ACCOUNTING` ve `TECHNICIAN` olarak ayrilir. Arayuz menuleri ve API endpointleri role gore filtrelenir.

### Istasyon, Pompa ve Yakit Tipi Yonetimi

Istasyon, pompa, yakit tipi ve tank bilgileri ayri veri modelleriyle tutulur. Bu yapi, ileride coklu istasyon ve merkez ofis raporlamasi icin genisletilebilir olacak sekilde tasarlanmistir.

### Satis, Stok ve Vardiya Surecleri

Satis olusturma akisi mock odeme onayi alir, ilgili tank stok seviyesini dusurur, satis kaydini olusturur ve audit/entegrasyon loglari uretir. Vardiya modulu acik vardiya kontrolu ve vardiya kapama surecini destekler.

### Raporlama ve Dogrulama Paneli

Raporlama servisleri satis ve stok ozetlerini dondurur. Dogrulama paneli mock pompa, odeme, ERP ve sistem kontrollerini calistirarak prototipin entegrasyon sagligini gostermeyi hedefler.

## Mali Operasyon Kapsami

Mali Operasyonlar modulu, akaryakit istasyonlarinin muhasebe ve e-donusum ihtiyaclari icin hazirlik katmani sunar:

- e-Fatura ve e-Arsiv belge kayitlari
- e-Defter calisma/dry-run kayitlari
- EPDK raporlama taslaklari
- OKC fis entegrasyonu icin mock gonderim
- Banka hareketi ve satis eslestirme temelli mutabakat
- Genel muhasebe hesap plani ve journal entry taslaklari
- KDV ve benzeri beyanname taslaklari

Bu modul resmi GIB, EPDK, OKC veya banka API formatlarini uyguladigini iddia etmez. Mevcut implementasyon mock/dry-run odaklidir. Resmi entegrasyon dokumanlari ve kurum/protokol detaylari netlestiginde adapterlar gercek servislerle degistirilecek sekilde soyutlanmistir.

## Teknik Mimari

Proje Node.js ve TypeScript tabanli bir monorepo olarak kurulmustur:

- Frontend: React, Vite, React Router, TanStack Query
- Backend: Express REST API, TypeScript, JWT auth, zod validation
- Database: Prisma ORM ve SQLite development/prototype veritabani
- Deploy: Render uzerinde tek Node Web Service
- Entegrasyon: provider-neutral servis arayuzleri ve mock adapterlar

Frontend ve backend ayrimi nettir. Web uygulamasi production modda API ile ayni domain altindan calisir; `/api/*` backend endpointlerini, diger route'lar React uygulamasini servis eder. Bu yapi public deploy icin tek URL uzerinden kullanimi kolaylastirir.

## Entegrasyon Yaklasimi

Entegrasyon katmani mock adapterlar uzerinden tasarlanmistir. Pompa, odeme, stok, ERP/e-donusum, EPDK, OKC, banka, muhasebe ve beyanname surecleri icin her islem loglanabilir ve dry-run olarak test edilebilir.

Gelecek entegrasyon fazlari:

1. Mock MVP: mevcut prototip; veri modeli, UI, rol yapisi ve dry-run kontrolleri.
2. Sandbox: resmi veya saglayici sandbox API'leri ile adapterlarin gercek endpointlere baglanmasi.
3. Pilot istasyon: tek istasyonda gercek pompa, POS, OKC ve ERP akislarinin denenmesi.
4. Production: merkezi loglama, alerting, offline kuyruklama, idempotency, cihaz sertifikalari ve tenant izolasyonu.

## Test ve Dogrulama Yaklasimi

Prototipte API testleri, build dogrulamasi ve manuel smoke test adimlari kullanilir. Mevcut dogrulama kapsaminda:

- Login ve rol bazli erisim
- Satis olusturma ve stok dusumu
- Yetersiz stok kontrolu
- Vardiya acma/kapama
- Mock entegrasyon loglari
- Mali operasyon dry-run islemleri
- Banka mutabakati
- Genel muhasebe fisi borc/alacak dengesi

Yayin oncesi standart komutlar:

```bash
npm run build
npm test
```

## Canli Demo Bilgisi

Uygulama Render uzerinde public olarak yayindadir:

```text
https://harun-karaca.onrender.com
```

Saglik kontrolu:

```text
https://harun-karaca.onrender.com/api/health
```

Demo kullanicisi:

```text
admin@demo.local / Admin123!
```

Render free plan kullanildigi icin servis bir sure kullanilmazsa uyku moduna gecebilir. Ilk acilis bu nedenle gecikebilir. SQLite verisi free/prototype modda kalici kabul edilmemelidir; restart veya redeploy sonrasi demo veri yeniden olusturulabilir.

## Gelecek Gelistirme Plani

Kisa vadeli gelistirme hedefleri:

- Ikinci kullanicidan gelen geri bildirimlere gore UI/UX iyilestirmeleri
- Mali Operasyonlar ekranlarinda daha detayli belge durum akislari
- Raporlarda tarih, istasyon ve yakit tipi filtreleri
- Daha kapsamli frontend smoke testleri
- Demo veri setinin gercek kullanim senaryolarina yaklastirilmasi

Orta vadeli hedefler:

- PostgreSQL veya kalici disk uzerinden veri kaliciligi
- Coklu istasyon/tenant izolasyonu
- Entegrasyon adapterlari icin sandbox modlari
- Hata kodu normalizasyonu, correlation id ve idempotency key
- Audit log export ve merkezi loglama

Uzun vadeli hedefler:

- Gercek POS, pompa, OKC, ERP, GIB/e-donusum, EPDK ve banka servisleriyle pilot entegrasyon
- Offline calisma ve kuyruklama
- Cihaz sertifikasi ve guvenli entegrasyon kimlik dogrulamasi
- Production monitoring, alerting ve SLA takip yapisi

## Sonuc

Harun Karaca, akaryakit istasyonlarinda operasyonel veri ile muhasebe/e-donusum sureclerini birlestirmeyi hedefleyen moduler bir yazilim prototipidir. Mevcut surum, gercek entegrasyon iddiasi yerine dogrulanabilir is akisi, mock servisler, rol bazli yetkilendirme, test edilebilir API ve public demo yayini uzerine odaklanir. Bu temel, geri bildirimlerle gelistirilmeye ve ileride gercek istasyon entegrasyonlarina tasinmaya uygundur.

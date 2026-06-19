# Entegrasyon Plani

## Faz 1: Mock MVP

- Pompa, odeme, stok, ERP, e-donusum, EPDK, OKC, banka, muhasebe ve beyanname adapterlari mock calisir.
- Her entegrasyon cagrisi `IntegrationLog` kaydi uretir.
- Dogrulama paneli mock servislerin ayakta oldugunu kontrol eder.

## Faz 2: Sandbox

- Mock adapter arayuzleri korunur, sandbox POS/pompa/ERP/GIB/EPDK/OKC/banka adapterlari eklenir.
- Idempotency key ve request correlation id uygulanir.
- Hata kodlari normalize edilir.

## Faz 3: Pilot Istasyon

- Tek istasyonda gercek pompa ve POS entegrasyonu denenir.
- Offline kuyruklama ve tekrar deneme politikasi eklenir.
- Vardiya kapama ve muhasebe aktarimi pilot verisiyle dogrulanir.

## Faz 4: Production

- Cihaz sertifikalari, merkezi loglama, alerting ve audit export eklenir.
- EPDK/e-donusum/OKC/banka/beyanname formatlari resmi entegrasyon dokumanlarina gore uygulanir.
- Coklu istasyon ve merkez ofis raporlamasi tenant izolasyonuyla genisletilir.

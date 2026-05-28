# Tavla Turnuvası — Kurulum Rehberi

## 1. Supabase Projesi Oluştur

1. [supabase.com](https://supabase.com) adresine git → "New Project" oluştur
2. Project URL ve anon key'i kopyala (Settings → API)

## 2. Veritabanı Şemasını Kur

Supabase dashboard → SQL Editor → `supabase/schema.sql` dosyasının içeriğini yapıştır ve çalıştır.

## 3. `.env.local` Dosyasını Güncelle

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
ADMIN_PASSWORD=güçlü_bir_şifre_seç
ADMIN_SESSION_SECRET=rastgele_uzun_bir_string
```

## 4. Geliştirme Sunucusu

```bash
npm run dev
```

Açılacak adres: http://localhost:3000

## 5. Kullanım Akışı

### Admin (sadece sen)
1. http://localhost:3000/admin/login → şifrenle giriş yap
2. **Oyuncular** → katılımcıları ekle
3. **Gruplar** → grup boyutunu ayarla → "Grupları Oluştur"
4. **Dashboard** → "GO LIVE" butonuna bas
5. **Maçlar** → Grup maçlarının skorlarını gir
6. Tüm grup maçları bittikten sonra "Bracket Oluştur"
7. Eleme maçlarının da skorlarını gir

### Kullanıcılar
- http://localhost:3000 → Ana sayfa
- /groups → Grup sıralamaları (canlı güncellenir)
- /bracket → Eleme bracketi (canlı güncellenir)

## 6. Vercel'e Deploy

```bash
# Vercel CLI kurulu değilse:
npm i -g vercel

# Deploy:
vercel

# Environment variables'ları Vercel dashboard'dan ekle
```

Vercel'de Environment Variables bölümüne .env.local içindeki 4 değeri ekle.

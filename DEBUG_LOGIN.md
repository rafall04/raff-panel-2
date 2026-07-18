# Debug Login OTP Issue

## Masalah

Login dengan nomor HP menghasilkan "unauthorized" tapi tidak ada log dari `authorize()` function.

## Langkah Debugging

### 1. Cek Browser Network Tab

1. Buka browser DevTools (F12)
2. Buka tab **Network**
3. Coba login dengan nomor HP
4. Cari request ke `/api/auth/callback/credentials` atau `/api/auth/...`
5. Klik request tersebut dan lihat:
   - **Request URL**: Harus ke `/api/auth/callback/credentials`
   - **Request Method**: Harus `POST`
   - **Request Payload**: Harus berisi `phoneNumber` dan `otp`
   - **Response Status**: Lihat status code
   - **Response Body**: Lihat response dari server

### 2. Cek Terminal NPM

Setelah login, cari log dengan pattern:

- `[NEXTAUTH OTP]`
- `[OTP VERIFY]`
- `[NEXTAUTH CALLBACK]`
- `[NEXTAUTH EVENT]`

### 3. Cek Browser Console

1. Buka browser DevTools (F12)
2. Buka tab **Console**
3. Cari log dengan prefix `[CLIENT]`

### 4. Kemungkinan Masalah

#### A. Request tidak sampai ke NextAuth

- **Gejala**: Tidak ada request ke `/api/auth/callback/credentials` di Network tab
- **Solusi**: Periksa apakah `signIn()` dipanggil dengan benar

#### B. Request sampai tapi authorize tidak dipanggil

- **Gejala**: Ada request ke `/api/auth/callback/credentials` tapi tidak ada log `[NEXTAUTH OTP]`
- **Solusi**: Periksa apakah provider ID benar (`'credentials'`)

#### C. Authorize dipanggil tapi error

- **Gejala**: Ada log `[NEXTAUTH OTP] ===== AUTHORIZE START =====` tapi tidak ada log `[NEXTAUTH OTP] ===== AUTHORIZE END =====`
- **Solusi**: Periksa log error setelah `AUTHORIZE START`

#### D. Backend tidak merespons

- **Gejala**: Ada log `[OTP VERIFY] ===== START =====` tapi tidak ada log `[OTP VERIFY] ===== END =====`
- **Solusi**: Periksa apakah backend di `localhost:3100` running dan endpoint `/api/auth/otp/verify` tersedia

## Informasi yang Dibutuhkan

Untuk debugging lebih lanjut, kirimkan:

1. Screenshot Network tab (request ke `/api/auth/...`)
2. Request Payload dari Network tab
3. Response dari Network tab
4. Semua log dari terminal npm (setelah login)
5. Semua log dari browser console (setelah login)

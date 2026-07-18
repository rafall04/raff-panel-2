# Analisis Detail Login OTP - Flow Lengkap

## 📊 Observasi dari Log NPM

```
POST /login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2F 200 in 83ms
POST /login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2F 200 in 49ms
POST /login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2F 200 in 51ms
```

**Fakta:**

- ✅ Form di-submit (POST /login)
- ❌ TIDAK ada POST /api/auth/callback/credentials
- ❌ TIDAK ada log dari [NEXTAUTH OTP]
- ❌ TIDAK ada log dari [OTP VERIFY]

**Kesimpulan:** `signIn()` tidak membuat request ke NextAuth endpoint.

---

## 🔍 Flow Login OTP yang Seharusnya

### Step 1: User Input

1. User memasukkan nomor HP
2. User klik "Send OTP"
3. `handleRequestOtp()` dipanggil
4. Request ke backend: `POST /api/auth/otp/request`
5. `otpSent` menjadi `true`
6. OTP field muncul

### Step 2: User Submit Form

1. User memasukkan OTP
2. User klik "Login with OTP" atau tekan Enter
3. Form `onSubmit` dipanggil
4. `handleWhatsAppLogin()` dipanggil
5. Validasi: `otpSent`, `phoneNumber`, `otp`
6. `signIn('credentials', {...})` dipanggil

### Step 3: NextAuth Client-Side

1. `signIn()` membuat request ke: `POST /api/auth/callback/credentials`
2. Request body: `{ provider: 'credentials', credentials: { phoneNumber, otp } }`
3. NextAuth route handler menerima request

### Step 4: NextAuth Server-Side

1. Route handler: `/api/auth/[...nextauth]/route.ts`
2. NextAuth memproses request
3. Memanggil provider `authorize()` function
4. Log: `[NEXTAUTH OTP] ===== AUTHORIZE START =====`

### Step 5: Backend Verification

1. `authorize()` memanggil `verify(phoneNumber, otp)`
2. Log: `[OTP VERIFY] ===== START =====`
3. Request ke backend: `POST http://localhost:3100/api/auth/otp/verify`
4. Backend merespons
5. Log: `[OTP VERIFY] ===== END =====`

### Step 6: NextAuth Callbacks

1. `authorize()` return user object
2. `jwt()` callback dipanggil
3. `session()` callback dipanggil
4. `signIn` event dipanggil

### Step 7: Response ke Client

1. NextAuth mengembalikan response
2. `signIn()` resolve dengan result
3. Client mengecek `result.ok`
4. Redirect ke dashboard jika success

---

## 🐛 Masalah yang Ditemukan

### Masalah Utama: signIn() Tidak Membuat Request

**Gejala:**

- Form di-submit (POST /login)
- Handler dipanggil (dari console log)
- TIDAK ada request ke `/api/auth/callback/credentials`
- TIDAK ada log dari NextAuth

**Kemungkinan Penyebab:**

#### 1. signIn() Tidak Dipanggil

- Validasi gagal sebelum `signIn()`
- Error di-swallow
- `signIn()` tidak ada di scope

#### 2. signIn() Dipanggil Tapi Tidak Membuat Request

- NextAuth client-side error
- Provider ID tidak ditemukan
- NextAuth configuration error
- Network error yang di-swallow

#### 3. Request Dibuat Tapi Ke Endpoint Salah

- NextAuth URL configuration salah
- Base URL salah
- Route handler tidak terdaftar

---

## 🔧 Phase Verifikasi

### Phase 1: Verifikasi signIn() Dipanggil

**Tujuan:** Memastikan `signIn()` benar-benar dipanggil

**Checkpoint:**

- [ ] Log `[CLIENT] Calling signIn('credentials')...` muncul
- [ ] Log `[CLIENT] signIn result:` muncul
- [ ] Tidak ada error sebelum `signIn()`

**Action:**

- Tambahkan logging sebelum dan sesudah `signIn()`
- Tambahkan try-catch untuk menangkap error

### Phase 2: Verifikasi Request Dibuat

**Tujuan:** Memastikan request dibuat ke NextAuth endpoint

**Checkpoint:**

- [ ] Request ke `/api/auth/callback/credentials` muncul di Network tab
- [ ] Request method: POST
- [ ] Request payload berisi `phoneNumber` dan `otp`

**Action:**

- Cek Network tab di browser
- Cek apakah NextAuth URL benar
- Cek apakah route handler terdaftar

### Phase 3: Verifikasi Request Sampai ke NextAuth

**Tujuan:** Memastikan request sampai ke NextAuth route handler

**Checkpoint:**

- [ ] Log dari NextAuth route handler muncul
- [ ] Log `[NEXTAUTH OTP] ===== AUTHORIZE START =====` muncul
- [ ] Credentials diterima dengan benar

**Action:**

- Tambahkan logging di route handler
- Cek apakah provider ID benar
- Cek apakah authorize() dipanggil

### Phase 4: Verifikasi Backend Request

**Tujuan:** Memastikan request sampai ke backend

**Checkpoint:**

- [ ] Log `[OTP VERIFY] ===== START =====` muncul
- [ ] Request ke backend dibuat
- [ ] Response dari backend diterima

**Action:**

- Cek apakah backend running
- Cek apakah API_URL benar
- Cek response format dari backend

---

## 📝 Checklist Debugging

### Browser Console

- [ ] `[CLIENT] ===== WHATSAPP LOGIN START =====`
- [ ] `[CLIENT] Validation passed, proceeding with login...`
- [ ] `[CLIENT] Calling signIn('credentials')...`
- [ ] `[CLIENT] signIn result: { ok: ..., error: ... }`

### Browser Network Tab

- [ ] Request ke `/api/auth/callback/credentials`
- [ ] Method: POST
- [ ] Status: 200 atau 401
- [ ] Request payload: `{ provider: 'credentials', credentials: { phoneNumber, otp } }`

### Terminal NPM

- [ ] `[NEXTAUTH OTP] ===== AUTHORIZE START =====`
- [ ] `[OTP VERIFY] ===== START =====`
- [ ] `[OTP VERIFY] HTTP Response Status: 200`
- [ ] `[OTP VERIFY] ===== END =====`
- [ ] `[NEXTAUTH OTP] ===== AUTHORIZE END (SUCCESS) =====`

---

## 🎯 Root Cause Analysis

Berdasarkan observasi:

1. Form submission bekerja (POST /login)
2. Handler dipanggil (dari console log sebelumnya)
3. `signIn()` kemungkinan dipanggil (dari console log sebelumnya)
4. TAPI request tidak dibuat ke NextAuth

**Kemungkinan Root Cause:**

- NextAuth client-side tidak membuat request karena provider tidak ditemukan
- NextAuth configuration error
- NextAuth URL/base URL salah
- NextAuth version compatibility issue

---

## 🔍 Langkah Investigasi

### 1. Cek NextAuth Configuration

- Provider ID: `'credentials'` vs `'username-password'`
- Apakah provider terdaftar dengan benar?
- Apakah ada konflik dengan provider lain?

### 2. Cek NextAuth Client-Side

- Apakah `signIn` function ter-import dengan benar?
- Apakah NextAuth provider terdaftar?
- Apakah ada error yang di-swallow?

### 3. Cek Network Request

- Apakah request dibuat tapi ke endpoint yang salah?
- Apakah request dibuat tapi di-block?
- Apakah ada CORS issue?

### 4. Cek NextAuth Version

- NextAuth version: 4.24.11
- Apakah kompatibel dengan Next.js 15.5.7?
- Apakah ada known issues?

---

## 💡 Solusi yang Perlu Dicoba

### Solusi 1: Ganti Provider ID

Coba ganti provider ID dari `'credentials'` ke `'otp'` atau `'phone-otp'` untuk menghindari konflik.

### Solusi 2: Cek NextAuth URL

Pastikan `NEXTAUTH_URL` environment variable di-set dengan benar.

### Solusi 3: Tambahkan Error Handling

Tambahkan error handling yang lebih baik untuk menangkap error dari `signIn()`.

### Solusi 4: Cek NextAuth Client Configuration

Pastikan NextAuth client-side terkonfigurasi dengan benar.

---

## 📋 Next Steps

1. **Verifikasi signIn() dipanggil** - Tambahkan logging lebih detail
2. **Verifikasi request dibuat** - Cek Network tab
3. **Verifikasi provider ID** - Pastikan provider terdaftar
4. **Verifikasi NextAuth config** - Pastikan konfigurasi benar
5. **Test dengan provider ID berbeda** - Coba ganti provider ID

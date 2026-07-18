# Phase Verifikasi Login OTP

## 📋 Phase 1: Verifikasi signIn() Dipanggil

### Tujuan

Memastikan `signIn()` benar-benar dipanggil dan tidak ada error sebelum pemanggilan.

### Checkpoint

- [ ] Log `[CLIENT] ===== BEFORE signIn() =====` muncul
- [ ] Log `[CLIENT] signIn function check:` menunjukkan `isFunction: true`
- [ ] Log `[CLIENT] Calling signIn('credentials')...` muncul
- [ ] Log `[CLIENT] Timestamp before signIn:` muncul
- [ ] Log `[CLIENT] ===== AFTER signIn() =====` muncul
- [ ] Log `[CLIENT] signIn completed in: X ms` muncul
- [ ] Log `[CLIENT] signIn result:` muncul dengan data

### Expected Logs (Browser Console)

```
[CLIENT] ===== BEFORE signIn() =====
[CLIENT] signIn function check: { exists: true, isFunction: true, signInType: "function" }
[CLIENT] Calling signIn('credentials')...
[CLIENT] Timestamp before signIn: 1234567890
[CLIENT] ===== AFTER signIn() =====
[CLIENT] signIn completed in: 150 ms
[CLIENT] signIn result: { ok: false, error: "...", status: 401, ... }
```

### Jika Checkpoint Gagal

- **signIn tidak dipanggil**: Cek validasi sebelum signIn()
- **signIn bukan function**: Cek import dari 'next-auth/react'
- **signIn result tidak muncul**: Cek apakah ada error yang di-swallow

---

## 📋 Phase 2: Verifikasi Request Dibuat ke NextAuth

### Tujuan

Memastikan `signIn()` membuat HTTP request ke NextAuth endpoint.

### Checkpoint

- [ ] Request ke `/api/auth/callback/credentials` muncul di Network tab
- [ ] Request Method: POST
- [ ] Request Status: 200, 401, atau 500 (bukan timeout)
- [ ] Request Payload berisi:
  ```json
  {
    "provider": "credentials",
    "credentials": {
      "phoneNumber": "6285...",
      "otp": "123456"
    },
    "callbackUrl": "http://localhost:3000/",
    "redirect": false
  }
  ```

### Expected Network Request

- **URL**: `http://localhost:3000/api/auth/callback/credentials`
- **Method**: POST
- **Headers**:
  - `Content-Type: application/x-www-form-urlencoded` atau `application/json`
  - `Cookie: next-auth.csrf-token=...`
- **Payload**: Form data atau JSON dengan credentials

### Jika Checkpoint Gagal

- **Tidak ada request**: signIn() tidak membuat request (NextAuth client error)
- **Request ke endpoint lain**: NextAuth URL configuration salah
- **Request timeout**: NextAuth endpoint tidak accessible

---

## 📋 Phase 3: Verifikasi Request Sampai ke NextAuth Route Handler

### Tujuan

Memastikan request sampai ke NextAuth route handler dan provider dipanggil.

### Checkpoint

- [ ] Log `[NEXTAUTH OTP] ===== AUTHORIZE START =====` muncul di terminal npm
- [ ] Log `[NEXTAUTH OTP] Credentials received:` muncul dengan data
- [ ] Credentials berisi `phoneNumber` dan `otp`
- [ ] Tidak ada error sebelum authorize() dipanggil

### Expected Logs (Terminal NPM)

```
[NEXTAUTH OTP] ===== AUTHORIZE START =====
[NEXTAUTH OTP] Credentials received: {
  hasPhoneNumber: true,
  hasOtp: true,
  phoneNumber: "6285****",
  otpLength: 6,
  ...
}
```

### Jika Checkpoint Gagal

- **Tidak ada log authorize**: Request tidak sampai atau provider tidak ditemukan
- **Credentials kosong**: Request body tidak ter-parse dengan benar
- **Provider ID salah**: NextAuth tidak menemukan provider dengan ID 'credentials'

---

## 📋 Phase 4: Verifikasi Backend Request

### Tujuan

Memastikan request sampai ke backend dan response diterima.

### Checkpoint

- [ ] Log `[OTP VERIFY] ===== START =====` muncul
- [ ] Log `[OTP VERIFY] Request Details:` muncul
- [ ] Log `[OTP VERIFY] HTTP Response Status: 200` (atau error status)
- [ ] Log `[OTP VERIFY] Response JSON:` muncul dengan data
- [ ] Log `[OTP VERIFY] Final Result:` muncul
- [ ] Log `[OTP VERIFY] ===== END =====` muncul

### Expected Logs (Terminal NPM)

```
[OTP VERIFY] ===== START =====
[OTP VERIFY] Request Details: { phoneNumber: "6285****", otpLength: 6, ... }
[OTP VERIFY] HTTP Response Status: 200 OK
[OTP VERIFY] Response JSON: { "status": 200, "message": "...", "data": {...} }
[OTP VERIFY] Final Result: { status: 200, hasToken: true, hasUser: true, ... }
[OTP VERIFY] ===== END =====
```

### Jika Checkpoint Gagal

- **Tidak ada log OTP VERIFY**: verify() tidak dipanggil
- **HTTP Status bukan 200**: Backend error atau credentials salah
- **Response tidak valid**: Format response backend tidak sesuai

---

## 📋 Phase 5: Verifikasi NextAuth Callbacks

### Tujuan

Memastikan NextAuth callbacks dipanggil dan session dibuat.

### Checkpoint

- [ ] Log `[NEXTAUTH CALLBACK] jwt() called:` muncul
- [ ] Log `[NEXTAUTH CALLBACK] session() called:` muncul
- [ ] Log `[NEXTAUTH EVENT] signIn event triggered:` muncul
- [ ] Token dan session berisi data user

### Expected Logs (Terminal NPM)

```
[NEXTAUTH CALLBACK] jwt() called: { hasUser: true, hasToken: true, ... }
[NEXTAUTH CALLBACK] session() called: { hasSession: true, hasToken: true, ... }
[NEXTAUTH EVENT] signIn event triggered: { hasUser: true, accountProvider: "credentials", ... }
```

### Jika Checkpoint Gagal

- **jwt() tidak dipanggil**: authorize() tidak return user object
- **session() tidak dipanggil**: JWT callback error
- **signIn event tidak dipanggil**: NextAuth internal error

---

## 📋 Phase 6: Verifikasi Response ke Client

### Tujuan

Memastikan response sampai ke client dan login berhasil.

### Checkpoint

- [ ] Log `[CLIENT] signIn result:` menunjukkan `ok: true`
- [ ] Log `[CLIENT] SUCCESS: Login successful` muncul
- [ ] Redirect ke dashboard terjadi
- [ ] Session tersimpan di browser

### Expected Logs (Browser Console)

```
[CLIENT] signIn result: { ok: true, error: null, status: 200, url: "/dashboard" }
[CLIENT] SUCCESS: Login successful
```

### Jika Checkpoint Gagal

- **ok: false**: authorize() throw error atau return null
- **error message**: Cek error dari NextAuth
- **Tidak redirect**: Cek redirect logic

---

## 🔍 Root Cause Analysis

Berdasarkan observasi log npm:

- ✅ Form submission bekerja
- ❌ signIn() tidak membuat request ke NextAuth
- ❌ Tidak ada log dari NextAuth

**Kemungkinan Root Cause:**

1. **NextAuth client-side tidak menemukan provider** dengan ID 'credentials'
2. **NextAuth configuration error** - provider tidak terdaftar dengan benar
3. **NextAuth version compatibility** - issue dengan Next.js 15.5.7
4. **signIn() return early** - ada validasi internal yang gagal

---

## 🎯 Action Items

### Immediate Actions

1. ✅ Tambahkan logging detail sebelum dan sesudah signIn()
2. ✅ Cek apakah provider ID benar
3. ✅ Cek apakah NextAuth URL configuration benar
4. ✅ Test dengan provider ID berbeda

### Next Steps

1. Cek Network tab untuk melihat apakah request dibuat
2. Cek apakah ada error di browser console
3. Cek apakah NextAuth route handler terdaftar dengan benar
4. Test dengan NextAuth version yang berbeda jika perlu

---

## 📊 Comparison: Username vs OTP Login

| Aspect               | Username Login                         | OTP Login                        |
| -------------------- | -------------------------------------- | -------------------------------- |
| Provider ID          | `'username-password'`                  | `'credentials'`                  |
| Request Endpoint     | `/api/auth/callback/username-password` | `/api/auth/callback/credentials` |
| Request Status       | 401 (sampai ke NextAuth)               | Tidak ada request                |
| Log dari authorize() | ✅ Ada                                 | ❌ Tidak ada                     |
| Log dari verify()    | ✅ Ada                                 | ❌ Tidak ada                     |

**Kesimpulan:** Provider dengan ID `'credentials'` tidak membuat request, sedangkan `'username-password'` bekerja.

---

## 💡 Hypothesis

**Hypothesis 1: Provider ID Conflict**

- NextAuth mungkin memiliki default provider dengan ID 'credentials'
- Provider custom dengan ID 'credentials' tidak terdaftar dengan benar
- **Solution**: Ganti provider ID ke 'otp' atau 'phone-otp'

**Hypothesis 2: NextAuth Client Configuration**

- NextAuth client-side tidak tahu tentang provider 'credentials'
- NextAuth perlu konfigurasi khusus untuk credentials provider
- **Solution**: Cek NextAuth client-side configuration

**Hypothesis 3: signIn() Internal Error**

- signIn() menemukan error internal sebelum membuat request
- Error di-swallow dan tidak muncul di log
- **Solution**: Tambahkan error handling yang lebih baik

---

## 🔧 Recommended Fixes

### Fix 1: Ganti Provider ID

```typescript
// Di src/lib/auth.ts
CredentialsProvider({
    id: 'otp', // Ganti dari 'credentials' ke 'otp'
    name: 'OTP',
    ...
})

// Di src/app/(auth)/login/page.tsx
const result = await signIn('otp', { // Ganti dari 'credentials' ke 'otp'
    redirect: false,
    phoneNumber: phoneNumber.trim(),
    otp: otp.trim(),
});
```

### Fix 2: Tambahkan Error Handling

```typescript
try {
    const result = await signIn('credentials', {...});
} catch (error) {
    // Log error dengan detail
    console.error("signIn error:", error);
    // Re-throw untuk handling di level atas
    throw error;
}
```

### Fix 3: Cek NextAuth Provider Registration

Pastikan provider terdaftar dengan benar di authOptions.

---

## 📝 Testing Checklist

Setelah implementasi fix, test:

- [ ] signIn() dipanggil (Phase 1)
- [ ] Request dibuat ke NextAuth (Phase 2)
- [ ] Request sampai ke authorize() (Phase 3)
- [ ] Backend request dibuat (Phase 4)
- [ ] Callbacks dipanggil (Phase 5)
- [ ] Login berhasil (Phase 6)

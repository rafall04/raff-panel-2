# Analisis Perbaikan API - Berdasarkan Dokumentasi

**Tanggal:** 2025-12-08  
**Dokumentasi Referensi:** `API_DOCUMENTATION_CUSTOMER_FRONTEND.md` v2.0.0

---

## 📋 Ringkasan

Berdasarkan analisis dokumentasi API dan kode yang ada, terdapat beberapa ketidaksesuaian antara implementasi frontend saat ini dengan spesifikasi backend. Dokumen ini mengidentifikasi semua area yang perlu diperbaiki.

---

## 🔍 Area yang Perlu Diperbaiki

### 1. **WiFi Management Endpoints** ❌

**Status:** Endpoint tidak sesuai dengan dokumentasi

**Masalah:**

- Saat ini menggunakan: `/api/wifi/ssid`, `/api/wifi/ssid/name`
- Seharusnya: `/api/customer/wifi/info`, `/api/customer/wifi/update-name`, `/api/customer/wifi/update-password`, `/api/customer/wifi/update`

**File yang Terpengaruh:**

- `src/services/wifi.service.ts`
- `src/app/dashboard/wifi/view.tsx`
- `src/app/dashboard/actions.ts` (getSSIDInfo)

**Endpoint yang Perlu Ditambahkan:**

- ✅ `GET /api/customer/wifi/info` - Get WiFi info (dengan query param `skipRefresh`)
- ✅ `GET /api/customer/wifi/connected-devices` - Get connected devices (BARU)
- ✅ `POST /api/customer/wifi/update-name` - Update WiFi name
- ✅ `POST /api/customer/wifi/update-password` - Update WiFi password
- ✅ `PUT /api/customer/wifi/update` - Update WiFi name & password

**Response Structure:**

- Backend mengembalikan: `{ status: 200, message: "...", data: {...} }`
- Frontend saat ini mungkin mengharapkan format berbeda

---

### 2. **Connected Devices Monitoring** ❌

**Status:** Belum diimplementasikan

**Masalah:**

- Endpoint `GET /api/customer/wifi/connected-devices` belum ada di service
- Fitur ini disebutkan di dokumentasi v2.0.0 sebagai fitur baru

**File yang Perlu Dibuat/Diupdate:**

- `src/services/wifi.service.ts` - Tambah method `getConnectedDevices()`
- Mungkin perlu komponen UI baru untuk menampilkan connected devices

---

### 3. **Speed On Demand Endpoints** ❌

**Status:** Endpoint tidak sesuai dengan dokumentasi

**Masalah:**

- Saat ini menggunakan: `/api/request-speed`, `/api/speed-boost/packages`
- Seharusnya: `/api/customer/speed-boost/available`, `/api/customer/speed-requests/*`

**File yang Terpengaruh:**

- `src/services/package.service.ts`
- `src/app/dashboard/actions.ts` (requestSpeedBoost)
- `src/app/dashboard/speed-boost/page.tsx`

**Endpoint yang Perlu Diperbaiki:**

- ✅ `GET /api/customer/speed-boost/available` - Check availability (mengganti `/api/speed-boost/packages`)
- ✅ `GET /api/customer/speed-requests/active` - Get active boost (BARU)
- ✅ `GET /api/customer/speed-requests/history` - Get history (BARU)
- ✅ `POST /api/customer/speed-requests/request` - Request boost (mengganti `/api/request-speed`)
- ✅ `POST /api/customer/speed-requests/cancel` - Cancel request (BARU)

**Request Body Changes:**

- Request speed boost perlu menambahkan `paymentMethod` (optional, default: 'cash')
- Response structure berbeda dengan yang ada sekarang

---

### 4. **Profile & Account Endpoints** ⚠️

**Status:** Perlu update untuk currentPassword requirement

**Masalah:**

- `POST /api/customer/account/update` sekarang memerlukan `currentPassword` (required)
- Saat ini mungkin belum ada validasi untuk currentPassword

**File yang Terpengaruh:**

- `src/services/auth.service.ts` - UpdateCredentialsRequest interface
- `src/app/dashboard/settings/view.tsx` - Form untuk update account

**Perubahan yang Diperlukan:**

- Tambahkan `currentPassword` sebagai required field
- Update interface `UpdateCredentialsRequest`

---

### 5. **Phone Number Management** ❌

**Status:** Belum diimplementasikan sama sekali

**Masalah:**

- Fitur ini adalah fitur baru di v2.0.0
- Tidak ada service atau UI untuk phone number management

**File yang Perlu Dibuat:**

- `src/services/phone.service.ts` - Service baru untuk phone number management
- Mungkin perlu halaman/komponen UI untuk manage phone numbers

**Endpoint yang Perlu Diimplementasikan:**

- ✅ `GET /api/customer/phone-numbers` - Get phone numbers
- ✅ `POST /api/customer/phone-numbers/add` - Add phone number
- ✅ `DELETE /api/customer/phone-numbers/:phoneNumber` - Remove phone number

**Response Structure:**

```typescript
{
  phone_numbers: string[];
  max_allowed: number;
  current_count: number;
  can_add_more: boolean;
}
```

---

### 6. **Package Change Request** ❌

**Status:** Endpoint mungkin tidak sesuai

**Masalah:**

- Di `actions.ts` ada `requestPackageChange()` tapi perlu dicek endpoint-nya
- Dokumentasi menyebutkan: `POST /api/customer/request-package-change`

**File yang Terpengaruh:**

- `src/app/dashboard/actions.ts` - requestPackageChange function
- Mungkin perlu service terpisah

**Perlu Dicek:**

- Apakah endpoint sudah sesuai dengan dokumentasi?
- Apakah response structure sudah sesuai?

---

### 7. **Report/Ticket Endpoints** ⚠️

**Status:** Perlu dicek endpoint dan response structure

**Masalah:**

- Saat ini: `/api/lapor`, `/api/lapor/history`
- Dokumentasi: `/api/lapor`, `/api/customer/reports/history`

**File yang Terpengaruh:**

- `src/services/report.service.ts`
- `src/app/dashboard/actions.ts` (getReportHistory)

**Perlu Dicek:**

- Endpoint history: `/api/lapor/history` vs `/api/customer/reports/history`
- Response structure sesuai dengan dokumentasi

---

### 8. **Dashboard Status Endpoint** ⚠️

**Status:** Endpoint sudah benar, tapi response structure perlu dicek

**Masalah:**

- Endpoint: `/api/dashboard-status` ✅ (sudah benar)
- Response structure mungkin perlu disesuaikan dengan dokumentasi

**File yang Terpengaruh:**

- `src/services/report.service.ts` - getDashboardStatus()
- `src/app/dashboard/actions.ts` - getDashboardStatus()

**Dokumentasi Response:**

```json
{
  "status": 200,
  "message": "Status dashboard berhasil diambil",
  "data": {
    "profile": {...},
    "activeSpeedBoost": null,
    "pendingReports": 0,
    "recentReports": []
  }
}
```

---

### 9. **Response Structure Handling** ⚠️

**Status:** Perlu disesuaikan dengan format backend

**Masalah:**

- Backend mengembalikan: `{ status: number, message: string, data: T }`
- Frontend mungkin mengharapkan: `{ success: boolean, data: T }`

**File yang Terpengaruh:**

- `src/lib/api-server.ts` - handleResponse method
- `src/lib/api-client.ts` - handleResponse method
- Semua service files

**Perlu Diperbaiki:**

- Update `handleResponse()` untuk handle format `{ status, message, data }`
- Pastikan error handling sesuai dengan format backend

---

### 10. **API Response Types** ⚠️

**Status:** Perlu update type definitions

**Masalah:**

- Type definitions mungkin tidak sesuai dengan response structure backend
- Perlu type untuk semua response baru

**File yang Terpengaruh:**

- `src/types/api.ts`
- Semua service files

**Type yang Perlu Ditambahkan:**

- WiFiInfoResponse
- ConnectedDevicesResponse
- SpeedBoostAvailableResponse
- SpeedBoostActiveResponse
- SpeedBoostHistoryResponse
- PhoneNumbersResponse
- PackageChangeRequestResponse
- dll.

---

## 📝 Rencana Perbaikan (Breakdown per Prompt)

### **Prompt 1: Update API Response Handling & Types**

- Update `api-server.ts` dan `api-client.ts` untuk handle format `{ status, message, data }`
- Update `types/api.ts` dengan type definitions baru
- Pastikan error handling sesuai dengan format backend

### **Prompt 2: Update WiFi Service & Endpoints**

- Update `wifi.service.ts` dengan endpoint baru sesuai dokumentasi
- Tambahkan method untuk connected devices
- Update response types
- Update `actions.ts` jika perlu

### **Prompt 3: Update Speed Boost/On Demand Service**

- Update `package.service.ts` atau buat service baru untuk speed boost
- Update semua endpoint sesuai dokumentasi
- Tambahkan method untuk active boost, history, dan cancel
- Update request/response types

### **Prompt 4: Implement Phone Number Management**

- Buat `phone.service.ts` baru
- Implement semua endpoint (GET, POST, DELETE)
- Buat type definitions
- (Optional) Buat UI component jika diperlukan

### **Prompt 5: Update Profile & Account Service**

- Update `auth.service.ts` untuk currentPassword requirement
- Update `customer.service.ts` jika perlu
- Update UI form untuk include currentPassword field

### **Prompt 6: Update Report Service & Package Change**

- Verifikasi dan update endpoint report
- Verifikasi dan update endpoint package change
- Pastikan response structure sesuai

### **Prompt 7: Testing & Validation**

- Test semua endpoint yang sudah diperbaiki
- Validasi response structure
- Fix any remaining issues

---

## ✅ Checklist Perbaikan

- [ ] Update API response handling untuk format `{ status, message, data }`
- [ ] Update type definitions di `types/api.ts`
- [ ] Update WiFi service dengan endpoint baru
- [ ] Implement Connected Devices endpoint
- [ ] Update Speed Boost service dengan endpoint baru
- [ ] Implement Phone Number Management service
- [ ] Update Profile & Account dengan currentPassword
- [ ] Verifikasi Report endpoints
- [ ] Verifikasi Package Change endpoint
- [ ] Update Dashboard Status handling
- [ ] Test semua endpoint
- [ ] Update UI components jika diperlukan

---

## 📌 Catatan Penting

1. **Response Format:** Backend menggunakan format `{ status, message, data }`, bukan `{ success, data }`
2. **Authentication:** Semua endpoint customer memerlukan JWT token di header `Authorization: Bearer <token>`
3. **Error Handling:** Backend mengembalikan error dengan format `{ status, message, error? }`
4. **Rate Limiting:** WiFi endpoints memiliki rate limiting (perlu dihandle di UI)
5. **Query Parameters:** Beberapa endpoint memiliki query parameters (e.g., `skipRefresh`)

---

**Last Updated:** 2025-12-08

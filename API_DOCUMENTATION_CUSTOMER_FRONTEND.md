# Dokumentasi API untuk Frontend Pelanggan

**Versi:** 2.0.0  
**Tanggal:** 2025-12-08  
**Base URL:** `http://your-domain.com` atau `https://your-domain.com`

> **Update v2.0.0:**
>
> - ✅ Tambah Connected Devices Monitoring endpoint
> - ✅ Tambah Phone Number Management endpoints
> - ✅ Update Profile & Account dengan currentPassword requirement
> - ✅ Tambah Package Change Request endpoint
> - ✅ Update API client example dengan semua methods baru

---

## 📋 Daftar Isi

1. [Autentikasi](#autentikasi)
2. [WiFi Management Endpoints](#wifi-management-endpoints)
3. [Connected Devices Monitoring](#connected-devices-monitoring)
4. [Speed On Demand Endpoints](#speed-on-demand-endpoints)
5. [Profile & Account Endpoints](#profile--account-endpoints)
6. [Phone Number Management](#phone-number-management)
7. [Package Change Request](#package-change-request)
8. [Report/Ticket Endpoints](#reportticket-endpoints)
9. [Dashboard Status](#dashboard-status)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)

---

## 🔐 Autentikasi

Semua endpoint customer memerlukan **JWT token** yang dikirim melalui:

### Header

```
Authorization: Bearer <token>
```

### Cookie (Alternatif)

```
Cookie: token=<token>
```

### Mendapatkan Token

Token didapatkan melalui endpoint login:

- **Endpoint:** `POST /api/login`
- **Body:**
  ```json
  {
    "username": "customer_username",
    "password": "customer_password"
  }
  ```
- **Response:**
  ```json
  {
    "status": 200,
    "message": "Login berhasil",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "name": "Nama Pelanggan",
        "username": "customer_username",
        "role": "customer"
      }
    }
  }
  ```

---

## 📶 WiFi Management Endpoints

### 1. Get WiFi Info

Mendapatkan informasi WiFi pelanggan (SSID yang diizinkan berdasarkan `bulk`).

**Endpoint:** `GET /api/customer/wifi/info`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `skipRefresh` (optional, boolean): Skip refresh dari GenieACS untuk performa lebih cepat (default: `true`)

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Info WiFi berhasil diambil",
  "data": {
    "device_id": "DEVICE123",
    "ssid": [
      {
        "id": "1",
        "index": 1,
        "name": "WiFi-Name-1",
        "enabled": true,
        "security": "WPA2",
        "frequency": "2.4GHz"
      },
      {
        "id": "2",
        "index": 2,
        "name": "WiFi-Name-2",
        "enabled": true,
        "security": "WPA2",
        "frequency": "5GHz"
      }
    ]
  }
}
```

**Catatan:**

- Hanya SSID yang ada di `customer.bulk` yang akan ditampilkan
- Password **TIDAK** dikembalikan untuk keamanan
- SSID index range: 1-8 (4 untuk 2.4GHz, 4 untuk 5GHz)

**Error Responses:**

- `401`: Unauthorized (token tidak valid)
- `404`: Device tidak ditemukan
- `429`: Rate limit exceeded
- `500`: Internal server error

---

### 2. Update WiFi Name

Mengubah nama WiFi untuk SSID tertentu.

**Endpoint:** `POST /api/customer/wifi/update-name`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "ssidIndex": 1,
  "newName": "NamaWiFiBaru"
}
```

**Field Validation:**

- `ssidIndex` (required, number): Index SSID (1-8)
- `newName` (required, string): Nama WiFi baru
  - Min length: 3 karakter
  - Max length: 32 karakter
  - Allowed characters: alphanumeric, underscore, dash, space

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Nama WiFi berhasil diubah",
  "data": {
    "ssidIndex": 1,
    "oldName": "WiFi-Name-1",
    "newName": "NamaWiFiBaru",
    "updatedAt": "2025-12-08T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400`: Validation error (SSID index tidak valid, nama tidak valid, atau SSID tidak ada di bulk)
- `401`: Unauthorized
- `404`: Device tidak ditemukan
- `429`: Rate limit exceeded (10 requests per 15 menit)
- `500`: Internal server error

**Contoh Error Response:**

```json
{
  "status": 400,
  "message": "SSID index harus antara 1-8 (4 untuk 2.4GHz dan 4 untuk 5GHz)."
}
```

---

### 3. Update WiFi Password

Mengubah password WiFi untuk SSID tertentu.

**Endpoint:** `POST /api/customer/wifi/update-password`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "ssidIndex": 1,
  "newPassword": "PasswordBaru123"
}
```

**Field Validation:**

- `ssidIndex` (required, number): Index SSID (1-8)
- `newPassword` (required, string): Password WiFi baru
  - Min length: 8 karakter
  - Max length: 63 karakter

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Password WiFi berhasil diubah",
  "data": {
    "ssidIndex": 1,
    "updatedAt": "2025-12-08T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400`: Validation error (SSID index tidak valid, password tidak valid, atau SSID tidak ada di bulk)
- `401`: Unauthorized
- `404`: Device tidak ditemukan
- `429`: Rate limit exceeded (10 requests per 15 menit)
- `500`: Internal server error

---

### 4. Update WiFi (Name & Password)

Mengubah nama dan/atau password WiFi sekaligus.

**Endpoint:** `PUT /api/customer/wifi/update`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "ssidIndex": 1,
  "newName": "NamaWiFiBaru",
  "newPassword": "PasswordBaru123"
}
```

**Field Validation:**

- `ssidIndex` (required, number): Index SSID (1-8)
- `newName` (optional, string): Nama WiFi baru (3-32 karakter)
- `newPassword` (optional, string): Password WiFi baru (8-63 karakter)
- **Minimal harus ada salah satu:** `newName` atau `newPassword`

**Response Success (200):**

```json
{
  "status": 200,
  "message": "WiFi berhasil diupdate",
  "data": {
    "ssidIndex": 1,
    "updatedFields": ["name", "password"],
    "updatedAt": "2025-12-08T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400`: Validation error
- `401`: Unauthorized
- `404`: Device tidak ditemukan
- `429`: Rate limit exceeded
- `500`: Internal server error

---

## 🚀 Speed On Demand Endpoints

### 1. Check Feature Availability

Cek apakah fitur Speed On Demand aktif.

**Endpoint:** `GET /api/customer/speed-boost/available`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Daftar paket speed boost berhasil diambil",
  "data": [
    {
      "name": "Premium",
      "price": 100000,
      "speed": "50 Mbps",
      "durations": {
        "1_day": 50000,
        "3_days": 120000,
        "7_days": 250000
      }
    }
  ]
}
```

**Response jika fitur disabled (503):**

```json
{
  "status": 503,
  "message": "Speed Boost sedang tidak tersedia saat ini",
  "data": []
}
```

---

### 2. Get Active Speed Boost

Mendapatkan informasi speed boost yang sedang aktif.

**Endpoint:** `GET /api/customer/speed-requests/active`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Speed boost aktif berhasil diambil",
  "data": {
    "requestId": "speed_1234567890",
    "requestedPackageName": "Premium",
    "durationKey": "7_days",
    "status": "approved",
    "paymentStatus": "paid",
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2025-12-08T00:00:00.000Z",
    "paymentAmount": 250000,
    "paymentMethod": "transfer"
  }
}
```

**Response jika tidak ada (200):**

```json
{
  "status": 200,
  "message": "Tidak ada speed boost yang aktif.",
  "data": null
}
```

---

### 3. Get Speed Boost History

Mendapatkan riwayat semua speed boost request.

**Endpoint:** `GET /api/customer/speed-requests/history`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Riwayat speed boost berhasil diambil",
  "data": [
    {
      "requestId": "speed_1234567890",
      "requestedPackageName": "Premium",
      "durationKey": "7_days",
      "status": "approved",
      "paymentStatus": "paid",
      "createdAt": "2025-12-01T00:00:00.000Z",
      "paymentAmount": 250000,
      "paymentMethod": "transfer"
    },
    {
      "requestId": "speed_0987654321",
      "requestedPackageName": "Ultra",
      "durationKey": "3_days",
      "status": "pending",
      "paymentStatus": "pending",
      "createdAt": "2025-12-05T00:00:00.000Z",
      "paymentAmount": 120000,
      "paymentMethod": "double_billing"
    }
  ]
}
```

---

### 4. Request Speed Boost

Membuat request speed boost baru.

**Endpoint:** `POST /api/customer/speed-requests/request`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "targetPackageName": "Premium",
  "duration": "7_days",
  "paymentMethod": "transfer"
}
```

**Field Validation:**

- `targetPackageName` (required, string): Nama paket tujuan
- `duration` (required, string): Durasi boost (`1_day`, `3_days`, atau `7_days`)
- `paymentMethod` (optional, string): Metode pembayaran (`cash`, `transfer`, `double_billing`), default: `cash`

**Response Success (201):**

```json
{
  "status": 201,
  "message": "Permintaan penambahan kecepatan Anda telah berhasil dikirim.",
  "data": {
    "requestId": "speed_1234567890",
    "paymentMethod": "transfer",
    "amount": 250000,
    "needsPaymentProof": true
  }
}
```

**Error Responses:**

- `400`: Validation error
- `401`: Unauthorized
- `503`: Speed Boost sedang tidak tersedia

---

### 5. Cancel Speed Boost Request

Membatalkan speed boost request yang masih pending.

**Endpoint:** `POST /api/customer/speed-requests/cancel`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "requestId": "speed_1234567890"
}
```

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Permintaan speed boost berhasil dibatalkan"
}
```

**Error Responses:**

- `400`: Request tidak bisa dibatalkan (sudah approved/rejected)
- `404`: Request tidak ditemukan

---

## 👤 Profile & Account Endpoints

### 1. Get Profile

Mendapatkan informasi profile pelanggan lengkap.

**Endpoint:** `GET /api/customer/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Profile berhasil diambil",
  "data": {
    "name": "Nama Pelanggan",
    "username": "customer_username",
    "packageName": "Basic",
    "monthlyBill": 100000,
    "dueDate": "2025-12-10T23:59:59.999Z",
    "paymentStatus": "PAID",
    "address": "Alamat Pelanggan",
    "phone_number": "6281234567890",
    "allowed_ssids": ["1", "2"]
  }
}
```

**Field Description:**

- `name`: Nama lengkap pelanggan
- `username`: Username untuk login
- `packageName`: Nama paket internet
- `monthlyBill`: Tagihan bulanan (Rupiah)
- `dueDate`: Jatuh tempo pembayaran (ISO 8601)
- `paymentStatus`: Status pembayaran (`PAID` atau `UNPAID`)
- `address`: Alamat pelanggan
- `phone_number`: Nomor HP utama
- `allowed_ssids`: Array SSID yang diizinkan untuk customer

---

### 2. Update Account

Mengupdate username dan/atau password akun pelanggan.

**Endpoint:** `POST /api/customer/account/update`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "currentPassword": "password_lama",
  "newUsername": "new_username",
  "newPassword": "new_password"
}
```

**Field Validation:**

- `currentPassword` (required, string): Password saat ini (untuk verifikasi)
- `newUsername` (optional, string): Username baru
- `newPassword` (optional, string): Password baru
- **Minimal harus ada salah satu:** `newUsername` atau `newPassword`

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Akun berhasil diupdate",
  "data": {
    "updatedFields": ["username"]
  }
}
```

**Error Responses:**

- `400`: Validation error (tidak ada data untuk diubah)
- `401`: Unauthorized
- `403`: Password saat ini salah
- `409`: Username sudah digunakan

---

## 📞 Phone Number Management

### 1. Get Phone Numbers

Mendapatkan daftar nomor HP yang terdaftar di akun pelanggan.

**Endpoint:** `GET /api/customer/phone-numbers`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Daftar nomor HP berhasil diambil",
  "data": {
    "phone_numbers": ["6281234567890", "6289876543210"],
    "max_allowed": 3,
    "current_count": 2,
    "can_add_more": true
  }
}
```

**Field Description:**

- `phone_numbers`: Array nomor HP yang terdaftar
- `max_allowed`: Maksimal nomor HP yang diizinkan (dari config)
- `current_count`: Jumlah nomor HP saat ini
- `can_add_more`: Boolean, apakah masih bisa menambah nomor

---

### 2. Add Phone Number

Menambahkan nomor HP baru ke akun pelanggan.

**Endpoint:** `POST /api/customer/phone-numbers/add`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "phoneNumber": "6281234567890"
}
```

**Field Validation:**

- `phoneNumber` (required, string): Nomor HP baru
  - Format: `08xxxxxxxxx` atau `628xxxxxxxxx` atau `+628xxxxxxxxx`
  - Akan dinormalisasi ke format `62xxxxxxxxxxx`

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Nomor HP berhasil ditambahkan.",
  "data": {
    "phone_numbers": ["6281234567890", "6289876543210", "628111222333"],
    "max_allowed": 3,
    "current_count": 3
  }
}
```

**Error Responses:**

- `400`: Validation error (format tidak valid, sudah mencapai limit, dll.)
- `401`: Unauthorized
- `409`: Conflict (nomor sudah terdaftar)

**Contoh Error Response:**

```json
{
  "status": 400,
  "message": "Maksimal 3 nomor HP sesuai konfigurasi. Anda sudah memiliki 3 nomor."
}
```

---

### 3. Remove Phone Number

Menghapus nomor HP dari akun pelanggan.

**Endpoint:** `DELETE /api/customer/phone-numbers/:phoneNumber`

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameter:**

- `phoneNumber`: Nomor HP yang akan dihapus (URL-encoded)

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Nomor HP berhasil dihapus.",
  "data": {
    "phone_numbers": ["6281234567890"],
    "current_count": 1
  }
}
```

**Error Responses:**

- `400`: Validation error (minimal 1 nomor harus ada)
- `401`: Unauthorized
- `404`: Nomor HP tidak ditemukan di akun customer

**Contoh Error Response:**

```json
{
  "status": 400,
  "message": "Tidak dapat menghapus nomor HP. Minimal harus ada 1 nomor HP di akun Anda."
}
```

**Catatan:**

- Minimal 1 nomor HP harus selalu ada di akun
- Nomor HP yang dihapus harus ada di list customer
- URL parameter harus di-encode jika mengandung karakter khusus

---

## 📦 Package Change Request

### Request Package Change

Mengajukan permintaan perubahan paket internet.

**Endpoint:** `POST /api/customer/request-package-change`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "targetPackageName": "Premium"
}
```

**Field Validation:**

- `targetPackageName` (required, string): Nama paket tujuan

**Response Success (201):**

```json
{
  "status": 201,
  "message": "Permintaan perubahan paket Anda telah berhasil dikirim dan menunggu persetujuan admin."
}
```

**Error Responses:**

- `400`: Validation error (paket tidak valid, sudah menggunakan paket tersebut, dll.)
- `401`: Unauthorized
- `404`: Paket tujuan tidak ditemukan
- `409`: Sudah ada request yang pending

**Contoh Error Response:**

```json
{
  "status": 409,
  "message": "Anda sudah memiliki permintaan perubahan paket yang sedang diproses. Mohon tunggu hingga selesai."
}
```

---

## 👤 Profile & Account Endpoints

### 1. Get Profile

Mendapatkan informasi profile pelanggan.

**Endpoint:** `GET /api/customer/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Profile berhasil diambil",
  "data": {
    "id": 1,
    "name": "Nama Pelanggan",
    "username": "customer_username",
    "phone_number": "6281234567890",
    "address": "Alamat Pelanggan",
    "subscription": "Basic",
    "device_id": "DEVICE123",
    "paid": true,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### 2. Update Account

Mengupdate informasi akun pelanggan.

**Endpoint:** `POST /api/customer/account/update`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "newUsername": "new_username",
  "newPassword": "new_password"
}
```

**Field Validation:**

- `newUsername` (optional, string): Username baru
- `newPassword` (optional, string): Password baru
- **Minimal harus ada salah satu:** `newUsername` atau `newPassword`

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Akun berhasil diupdate",
  "data": {
    "updatedFields": ["username"]
  }
}
```

---

## 📋 Report/Ticket Endpoints

### 1. Submit Report

Mengirim laporan gangguan.

**Endpoint:** `POST /api/lapor`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "issue_type": "internet_lambat",
  "description": "Internet sangat lambat sejak pagi",
  "location": "Rumah"
}
```

**Response Success (201):**

```json
{
  "status": 201,
  "message": "Laporan berhasil dikirim",
  "data": {
    "ticketId": "TKT-20251208-001",
    "status": "pending",
    "createdAt": "2025-12-08T10:30:00.000Z"
  }
}
```

---

### 2. Get Report History

Mendapatkan riwayat laporan.

**Endpoint:** `GET /api/customer/reports/history`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Riwayat laporan berhasil diambil",
  "data": [
    {
      "ticketId": "TKT-20251208-001",
      "issue_type": "internet_lambat",
      "status": "pending",
      "createdAt": "2025-12-08T10:30:00.000Z"
    }
  ]
}
```

---

## 📊 Dashboard Status

### Get Dashboard Status

Mendapatkan status lengkap untuk dashboard pelanggan.

**Endpoint:** `GET /api/dashboard-status`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Status dashboard berhasil diambil",
  "data": {
    "profile": {
      "name": "Nama Pelanggan",
      "subscription": "Basic",
      "paid": true
    },
    "activeSpeedBoost": null,
    "pendingReports": 0,
    "recentReports": []
  }
}
```

---

## ⚠️ Error Handling

Semua endpoint mengembalikan error dalam format yang konsisten:

```json
{
  "status": 400,
  "message": "Pesan error dalam Bahasa Indonesia",
  "error": "Detail error (optional)"
}
```

### Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (token tidak valid)
- `403`: Forbidden (tidak memiliki akses)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable (fitur disabled)

---

## 🚦 Rate Limiting

### WiFi Endpoints

- **Read operations** (`GET /api/customer/wifi/info`): 30 requests per 15 menit
- **Write operations** (`POST /api/customer/wifi/*`, `PUT /api/customer/wifi/*`): 10 requests per 15 menit

### Response saat Rate Limit Exceeded

```json
{
  "status": 429,
  "message": "Terlalu banyak permintaan WiFi. Silakan coba lagi dalam 15 menit."
}
```

Headers yang dikembalikan:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1733659200
Retry-After: 900
```

---

## 📝 Contoh Implementasi Frontend

### JavaScript/TypeScript Example

```typescript
// API Client
class CustomerAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem("token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ status: number; message: string; data: T }> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  // WiFi Management
  async getWifiInfo(skipRefresh = true) {
    return this.request(`/api/customer/wifi/info?skipRefresh=${skipRefresh}`);
  }

  async getConnectedDevices(skipRefresh = true) {
    return this.request(
      `/api/customer/wifi/connected-devices?skipRefresh=${skipRefresh}`,
    );
  }

  async updateWifiName(ssidIndex: number, newName: string) {
    return this.request("/api/customer/wifi/update-name", {
      method: "POST",
      body: JSON.stringify({ ssidIndex, newName }),
    });
  }

  async updateWifiPassword(ssidIndex: number, newPassword: string) {
    return this.request("/api/customer/wifi/update-password", {
      method: "POST",
      body: JSON.stringify({ ssidIndex, newPassword }),
    });
  }

  async updateWifi(ssidIndex: number, newName?: string, newPassword?: string) {
    return this.request("/api/customer/wifi/update", {
      method: "PUT",
      body: JSON.stringify({ ssidIndex, newName, newPassword }),
    });
  }

  // Phone Number Management
  async getPhoneNumbers() {
    return this.request("/api/customer/phone-numbers");
  }

  async addPhoneNumber(phoneNumber: string) {
    return this.request("/api/customer/phone-numbers/add", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async removePhoneNumber(phoneNumber: string) {
    // URL encode phone number untuk DELETE request
    const encodedPhone = encodeURIComponent(phoneNumber);
    return this.request(`/api/customer/phone-numbers/${encodedPhone}`, {
      method: "DELETE",
    });
  }

  // Package Change Request
  async requestPackageChange(targetPackageName: string) {
    return this.request("/api/customer/request-package-change", {
      method: "POST",
      body: JSON.stringify({ targetPackageName }),
    });
  }

  // Speed On Demand
  async getAvailableSpeedBoosts() {
    return this.request("/api/customer/speed-boost/available");
  }

  async getActiveSpeedBoost() {
    return this.request("/api/customer/speed-requests/active");
  }

  async requestSpeedBoost(
    targetPackageName: string,
    duration: string,
    paymentMethod = "cash",
  ) {
    return this.request("/api/customer/speed-requests/request", {
      method: "POST",
      body: JSON.stringify({ targetPackageName, duration, paymentMethod }),
    });
  }

  // Profile
  async getProfile() {
    return this.request("/api/customer/profile");
  }
}

// Usage
const api = new CustomerAPI("https://your-domain.com");

try {
  const wifiInfo = await api.getWifiInfo();
  console.log("WiFi Info:", wifiInfo.data);
} catch (error) {
  console.error("Error:", error.message);
}
```

---

## 🔧 Konfigurasi

### Speed On Demand

Speed On Demand dapat diaktifkan/nonaktifkan melalui:

1. **Halaman Admin:** `/config` → Field "Speed On Demand"
2. **File Config:** `database/speed_boost_matrix.json` → `enabled: true/false`

**Catatan:** Jika `enabled: false`, semua endpoint speed boost akan mengembalikan `503 Service Unavailable`.

### Phone Number Limit

Maksimal nomor HP per customer dapat diatur melalui:

1. **Halaman Admin:** `/config` → Field "Maksimal akses" (`accessLimit`)
2. **File Config:** `config.json` atau `database/cron.json` → `accessLimit`

**Default:** 3 nomor HP jika config tidak ada

### Default SSID Bulk

SSID default untuk customer baru dapat diatur melalui:

1. **Halaman Admin:** `/config` → Field "Default SSID Bulk"
2. **File Config:** `config.json` → `defaultBulkSSID`

**Default:** SSID 1 jika config tidak ada

---

## 📚 Referensi Tambahan

- [API Workflow Documentation](./API_WORKFLOW.md)
- [Security Analysis WiFi Endpoints](./SECURITY_ANALYSIS_WIFI_ENDPOINTS.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

---

## 📚 Quick Reference - All Endpoints

### Authentication

- `POST /api/login` - Login dan dapatkan token

### WiFi Management

- `GET /api/customer/wifi/info` - Get WiFi info
- `GET /api/customer/wifi/connected-devices` - Get connected devices
- `POST /api/customer/wifi/update-name` - Update WiFi name
- `POST /api/customer/wifi/update-password` - Update WiFi password
- `PUT /api/customer/wifi/update` - Update WiFi name & password

### Speed On Demand

- `GET /api/customer/speed-boost/available` - Check availability
- `GET /api/customer/speed-requests/active` - Get active boost
- `GET /api/customer/speed-requests/history` - Get history
- `POST /api/customer/speed-requests/request` - Request boost
- `POST /api/customer/speed-requests/cancel` - Cancel request

### Profile & Account

- `GET /api/customer/profile` - Get profile
- `POST /api/customer/account/update` - Update username/password

### Phone Number Management

- `GET /api/customer/phone-numbers` - Get phone numbers
- `POST /api/customer/phone-numbers/add` - Add phone number
- `DELETE /api/customer/phone-numbers/:phoneNumber` - Remove phone number

### Package Change

- `POST /api/customer/request-package-change` - Request package change

### Reports/Tickets

- `POST /api/lapor` - Submit report
- `GET /api/customer/reports/history` - Get report history

### Dashboard

- `GET /api/dashboard-status` - Get dashboard status

---

## 🔧 Konfigurasi

### Speed On Demand

Speed On Demand dapat diaktifkan/nonaktifkan melalui:

1. **Halaman Admin:** `/config` → Field "Speed On Demand"
2. **File Config:** `database/speed_boost_matrix.json` → `enabled: true/false`

### Phone Number Limit

Maksimal nomor HP per customer dapat diatur melalui:

1. **Halaman Admin:** `/config` → Field "Maksimal akses" (`accessLimit`)
2. **File Config:** `config.json` atau `database/cron.json` → `accessLimit`

**Default:** 3 nomor HP jika config tidak ada

### Default SSID Bulk

SSID default untuk customer baru dapat diatur melalui:

1. **Halaman Admin:** `/config` → Field "Default SSID Bulk"
2. **File Config:** `config.json` → `defaultBulkSSID`

**Default:** SSID 1 jika config tidak ada

---

**Last Updated:** 2025-12-08  
**Version:** 2.0.0

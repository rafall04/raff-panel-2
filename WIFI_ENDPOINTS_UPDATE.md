# WiFi Endpoints Update - New Features

**Tanggal:** 2025-12-08  
**Versi:** 2.1.0

---

## 📋 Summary Perubahan

### 1. ✅ Reboot Router Endpoint

Endpoint baru untuk reboot router customer.

### 2. ✅ WiFi Info - Default Values

- `lastInform`: Default `null` jika tidak tersedia
- `uptime`: Default `"Tidak Tersedia"` jika tidak tersedia
- `transmitPower`: Default `"100%"` jika tidak tersedia

### 3. ✅ Connected Devices - Dual Format Support

Support kedua format:

- **Grouped by SSID** (default)
- **Flat list** (semua devices dalam satu array)

---

## 🔄 New Endpoint: Reboot Router

### Endpoint

`POST /api/customer/wifi/reboot`

### Authentication

JWT Token required

### Request

```http
POST /api/customer/wifi/reboot
Authorization: Bearer <JWT_TOKEN>
```

### Response Success (200)

```json
{
  "status": 200,
  "message": "Perintah reboot berhasil dikirim. Router akan restart dalam beberapa detik.",
  "data": {
    "deviceId": "DEVICE123",
    "message": "Perintah reboot berhasil dikirim. Router akan restart dalam beberapa detik.",
    "rebootSent": true,
    "timestamp": "2025-12-08T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 - Validation Error

```json
{
  "status": 400,
  "message": "Customer tidak ditemukan"
}
```

#### 404 - Device Not Found

```json
{
  "status": 404,
  "message": "Device ID tidak ditemukan untuk akun Anda. Silakan hubungi admin."
}
```

#### 500 - Internal Server Error

```json
{
  "status": 500,
  "message": "Gagal mengirim perintah reboot. Silakan coba lagi nanti."
}
```

#### 429 - Rate Limit Exceeded

```json
{
  "status": 429,
  "message": "Terlalu banyak request. Silakan coba lagi nanti."
}
```

### Rate Limiting

- **Limit:** 10 requests per 15 menit (menggunakan `wifiWriteRateLimiter`)

### Notes

- Reboot command dikirim ke GenieACS
- Router akan restart dalam beberapa detik setelah command diterima
- Koneksi akan terputus sementara selama ±2 menit
- Customer hanya bisa reboot router mereka sendiri

---

## 📶 WiFi Info - Updated Response

### Endpoint

`GET /api/customer/wifi/info`

### Updated Response Format

```json
{
  "status": 200,
  "message": "Info WiFi berhasil diambil",
  "data": {
    "deviceId": "DEVICE123",
    "uptime": "2 days" || "Tidak Tersedia",
    "lastInform": "2025-12-08T10:30:00.000Z" || null,
    "ssid": [
      {
        "id": "1",
        "index": 1,
        "name": "WiFi-Name-1",
        "enabled": true,
        "security": "WPA2",
        "frequency": "2.4GHz",
        "transmitPower": "100%" || "75%" || "50%" || "25%"
      }
    ],
    "allowedSSIDs": [1, 2],
    "totalSSIDs": 2
  }
}
```

### Default Values

- **uptime**: `"Tidak Tersedia"` jika tidak tersedia dari GenieACS
- **lastInform**: `null` jika tidak tersedia dari GenieACS
- **transmitPower**: `"100%"` jika tidak tersedia dari GenieACS

### Notes

- `lastInform` diambil dari field `_lastInform` di GenieACS device data
- `transmitPower` diambil dari `TransmitPower._value` di WLANConfiguration
- Jika `transmitPower` tidak tersedia, default ke `"100%"`

---

## 📱 Connected Devices - Dual Format Support

### Endpoint

`GET /api/customer/wifi/connected-devices`

### Query Parameters

- `skipRefresh` (optional, boolean): Skip refresh dari GenieACS (default: `true`)
- `format` (optional, string): Format response - `"grouped"` atau `"flat"` (default: `"grouped"`)

### Format 1: Grouped by SSID (Default)

**Request:**

```http
GET /api/customer/wifi/connected-devices?format=grouped
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "status": 200,
  "message": "Data device terkoneksi berhasil diambil",
  "data": {
    "device_id": "DEVICE123",
    "total_devices": 5,
    "format": "grouped",
    "ssid_devices": [
      {
        "ssid_index": 1,
        "ssid_id": "1",
        "ssid_name": "WiFi-Name-1",
        "device_count": 3,
        "devices": [
          {
            "mac_address": "AA:BB:CC:DD:EE:FF",
            "ip_address": "192.168.1.100",
            "host_name": "Device-Name",
            "signal_strength": -45,
            "signal_unit": "dBm"
          }
        ]
      },
      {
        "ssid_index": 2,
        "ssid_id": "2",
        "ssid_name": "WiFi-Name-2",
        "device_count": 2,
        "devices": [
          {
            "mac_address": "11:22:33:44:55:66",
            "ip_address": "192.168.1.101",
            "host_name": "Another-Device",
            "signal_strength": -50,
            "signal_unit": "dBm"
          }
        ]
      }
    ]
  }
}
```

### Format 2: Flat List

**Request:**

```http
GET /api/customer/wifi/connected-devices?format=flat
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "status": 200,
  "message": "Data device terkoneksi berhasil diambil",
  "data": {
    "device_id": "DEVICE123",
    "total_devices": 5,
    "format": "flat",
    "devices": [
      {
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "ip_address": "192.168.1.100",
        "host_name": "Device-Name",
        "signal_strength": -45,
        "signal_unit": "dBm",
        "ssid_index": 1,
        "ssid_id": "1",
        "ssid_name": "WiFi-Name-1"
      },
      {
        "mac_address": "11:22:33:44:55:66",
        "ip_address": "192.168.1.101",
        "host_name": "Another-Device",
        "signal_strength": -50,
        "signal_unit": "dBm",
        "ssid_index": 2,
        "ssid_id": "2",
        "ssid_name": "WiFi-Name-2"
      }
    ]
  }
}
```

### Notes

- Default format adalah `"grouped"` jika tidak ditentukan
- Format `"flat"` berguna untuk menampilkan semua devices dalam satu list tanpa grouping
- Setiap device di format `"flat"` include informasi SSID (`ssid_index`, `ssid_id`, `ssid_name`)

---

## 🔧 Implementation Details

### Reboot Router Service Method

```javascript
// lib/services/wifi-service.js
static async rebootCustomerRouter(customer, req = null) {
    // Validasi customer dan device_id
    // Audit log
    // Panggil rebootRouter() dari lib/wifi.js
    // Return user-friendly response
}
```

### WiFi Info - Default Values

```javascript
// lib/services/wifi-service.js - getCustomerWifiInfo()
// 1. transmitPower: ssid.transmitPower || "100%"
// 2. lastInform: Diambil dari GenieACS _lastInform field
// 3. uptime: wifiInfo.uptime || "Tidak Tersedia"
```

### Connected Devices - Format Support

```javascript
// lib/services/wifi-service.js - getConnectedDevices()
const format = req.query.format || "grouped";

if (format === "flat") {
  // Return flat list dengan SSID info di setiap device
} else {
  // Return grouped by SSID (default)
}
```

---

## 📚 Example Usage

### TypeScript/JavaScript Examples

#### 1. Reboot Router

```typescript
const rebootResponse = await fetch("/api/customer/wifi/reboot", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const result = await rebootResponse.json();
if (result.status === 200) {
  console.log("Reboot command sent:", result.data.message);
}
```

#### 2. Get WiFi Info (with defaults)

```typescript
const wifiInfoResponse = await fetch("/api/customer/wifi/info", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const wifiInfo = await wifiInfoResponse.json();
console.log("Uptime:", wifiInfo.data.uptime); // "2 days" atau "Tidak Tersedia"
console.log("Last Inform:", wifiInfo.data.lastInform); // ISO string atau null
console.log("Transmit Power:", wifiInfo.data.ssid[0].transmitPower); // "100%" atau actual value
```

#### 3. Get Connected Devices - Grouped Format

```typescript
const devicesResponse = await fetch(
  "/api/customer/wifi/connected-devices?format=grouped",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

const devices = await devicesResponse.json();
devices.data.ssid_devices.forEach((ssidData) => {
  console.log(`SSID ${ssidData.ssid_name}: ${ssidData.device_count} devices`);
  ssidData.devices.forEach((device) => {
    console.log(`  - ${device.host_name} (${device.ip_address})`);
  });
});
```

#### 4. Get Connected Devices - Flat Format

```typescript
const devicesResponse = await fetch(
  "/api/customer/wifi/connected-devices?format=flat",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

const devices = await devicesResponse.json();
devices.data.devices.forEach((device) => {
  console.log(
    `${device.host_name} on ${device.ssid_name} (${device.ip_address})`,
  );
});
```

---

## ✅ Testing Checklist

- [ ] Reboot router endpoint berfungsi dengan benar
- [ ] Error handling untuk reboot (device not found, network error, dll.)
- [ ] WiFi info return default values untuk uptime, lastInform, transmitPower
- [ ] Connected devices format "grouped" berfungsi
- [ ] Connected devices format "flat" berfungsi
- [ ] Rate limiting untuk reboot endpoint (10 requests/15 min)
- [ ] Audit logging untuk semua operasi

---

**Last Updated:** 2025-12-08

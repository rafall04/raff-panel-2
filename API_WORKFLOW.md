# API Workflow Documentation

Dokumentasi lengkap tentang workflow menghubungkan frontend dengan backend.

## 📋 Daftar Isi

1. [Arsitektur](#arsitektur)
2. [Struktur File](#struktur-file)
3. [API Client](#api-client)
4. [Service Layer](#service-layer)
5. [Server Actions](#server-actions)
6. [Client-side Hooks](#client-side-hooks)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Contoh Penggunaan](#contoh-penggunaan)

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
├─────────────────────────────────────────────────────────┤
│  Components → Hooks → Services → API Client → Backend   │
└─────────────────────────────────────────────────────────┘
```

### Layer Architecture

1. **Components** - UI components yang menggunakan hooks atau server actions
2. **Hooks** - React hooks untuk client-side data fetching
3. **Services** - Business logic layer, mengorganisir API calls per domain
4. **API Client** - HTTP client dengan authentication dan error handling
5. **Backend** - REST API backend

---

## Struktur File

```
src/
├── lib/
│   ├── api-client.ts      # Client-side API client
│   └── api-server.ts      # Server-side API client
├── services/
│   ├── auth.service.ts
│   ├── customer.service.ts
│   ├── wifi.service.ts
│   ├── report.service.ts
│   ├── package.service.ts
│   ├── news.service.ts
│   └── announcement.service.ts
├── hooks/
│   └── use-api.ts         # React hook untuk API calls
├── utils/
│   ├── error-handler.ts   # Error handling utilities
│   └── server-actions.ts  # Server actions helpers
├── types/
│   └── api.ts             # API type definitions
└── components/
    └── error-boundary.tsx # Error boundary component
```

---

## API Client

### Client-side API Client (`api-client.ts`)

**⚠️ Important:** Untuk security, disarankan menggunakan Next.js API routes sebagai proxy daripada langsung call ke backend dari client-side.

**Jika perlu client-side calls langsung ke backend:**

- Digunakan untuk client-side API calls (dari React components)
- Automatic authentication token injection
- Request/response interceptors
- Error handling
- Timeout handling
- Type-safe responses

**Contoh:**

```typescript
import { apiClient } from "@/lib/api-client";

// GET request
const response = await apiClient.get<User>("/api/user/profile");

// POST request
const response = await apiClient.post<CreateUserResponse>("/api/users", {
  name: "John",
  email: "john@example.com",
});

// With custom options
const response = await apiClient.get("/api/public/data", {
  requireAuth: false,
  timeout: 10000,
});
```

**Recommended: Use Next.js API Routes as Proxy**

Untuk security, buat API route di `app/api/` yang memanggil backend:

```typescript
// app/api/customer/profile/route.ts
import { serverApiClient } from "@/lib/api-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await serverApiClient.get("/api/customer/profile");
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
```

Kemudian di client:

```typescript
// Client-side
const response = await fetch("/api/customer/profile");
const data = await response.json();
```

### Server-side API Client (`api-server.ts`)

Digunakan untuk server components dan server actions.

**Fitur:**

- Server-side authentication (from NextAuth session)
- Optimized for server-side rendering
- No timeout (server-to-server)
- Type-safe responses

**Contoh:**

```typescript
import { serverApiClient } from "@/lib/api-server";

// In server component or server action
export async function getUserProfile() {
  const response = await serverApiClient.get<User>("/api/user/profile");
  return response.data;
}
```

---

## Service Layer

Service layer mengorganisir API calls berdasarkan domain/business logic.

### Struktur Service

Setiap service adalah class dengan static methods:

```typescript
export class AuthService {
  static async login(username: string, password: string) {
    return serverApiClient.post("/api/auth/login", {
      username,
      password,
    });
  }
}
```

### Available Services

1. **AuthService** - Authentication (login, OTP, etc.)
2. **CustomerService** - Customer profile and data
3. **WifiService** - WiFi/SSID management
4. **ReportService** - Reports and tickets
5. **PackageService** - Packages and speed boost
6. **NewsService** - News articles
7. **AnnouncementService** - Announcements

### Contoh Service

```typescript
// src/services/customer.service.ts
import { serverApiClient } from "@/lib/api-server";

export class CustomerService {
  static async getProfile() {
    return serverApiClient.get<CustomerInfo>("/api/customer/profile");
  }
}
```

---

## Server Actions

Server actions digunakan untuk mutations dan server-side data fetching.

### Basic Server Action

```typescript
"use server";

import { CustomerService } from "@/services/customer.service";
import { createServerAction } from "@/utils/server-actions";

export async function getCustomerProfile() {
  return createServerAction(() => CustomerService.getProfile(), {
    revalidatePaths: ["/dashboard"],
    successMessage: "Profile loaded successfully",
  });
}
```

### Form Action

```typescript
"use server";

import { ReportService } from "@/services/report.service";
import { createFormAction } from "@/utils/server-actions";

export const submitReport = createFormAction(
  async (formData: FormData) => {
    const category = formData.get("category") as string;
    const reportText = formData.get("description") as string;

    return ReportService.submitReport({ category, reportText });
  },
  {
    revalidatePaths: ["/dashboard"],
    successMessage: "Report submitted successfully",
  },
);
```

### Menggunakan di Component

```typescript
import { submitReport } from "@/app/dashboard/actions";

export function ReportForm() {
  return (
    <form action={submitReport}>
      {/* form fields */}
    </form>
  );
}
```

---

## Client-side Hooks

Untuk client-side data fetching dan mutations.

### useApi Hook

```typescript
import { useApi } from "@/hooks/use-api";
import { CustomerService } from "@/services/customer.service";

export function CustomerProfile() {
  const { data, loading, error, execute } = useApi(
    CustomerService.getProfile
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <div>{data.name}</div>;
}
```

### useApiQuery Hook

Untuk immediate execution:

```typescript
import { useApiQuery } from "@/hooks/use-api-query";
import { CustomerService } from "@/services/customer.service";

export function CustomerProfile() {
  const { data, loading, error } = useApiQuery(
    CustomerService.getProfile,
    [], // args
    { enabled: true }, // options
  );

  // Automatically executes on mount
  // ...
}
```

Atau dengan useApi + useEffect:

```typescript
import { useApi } from "@/hooks/use-api";
import { CustomerService } from "@/services/customer.service";
import { useEffect } from "react";

export function CustomerProfile() {
  const { data, loading, error, execute } = useApi(CustomerService.getProfile);

  useEffect(() => {
    execute();
  }, [execute]);

  // ...
}
```

---

## Error Handling

### Error Types

1. **ApiError** - Client-side API errors
2. **ServerApiError** - Server-side API errors

### Error Handling Utilities

```typescript
import {
  getErrorMessage,
  getErrorInfo,
  isAuthError,
} from "@/utils/error-handler";

try {
  await CustomerService.getProfile();
} catch (error) {
  // Get user-friendly message
  const message = getErrorMessage(error);

  // Get detailed error info
  const errorInfo = getErrorInfo(error);

  // Check error type
  if (isAuthError(error)) {
    // Redirect to login
  }
}
```

### Error Boundary

Wrap components dengan ErrorBoundary:

```typescript
import { ErrorBoundary } from "@/components/error-boundary";

export function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

---

## Best Practices

### 1. Gunakan Service Layer

✅ **Good:**

```typescript
import { CustomerService } from "@/services/customer.service";
const profile = await CustomerService.getProfile();
```

❌ **Bad:**

```typescript
const response = await fetch(`${API_URL}/api/customer/profile`);
```

### 2. Gunakan Type Safety

✅ **Good:**

```typescript
const response = await CustomerService.getProfile();
const profile: CustomerInfo = response.data!;
```

❌ **Bad:**

```typescript
const response = await fetch("/api/customer/profile");
const profile = await response.json(); // any type
```

### 3. Handle Errors Properly

✅ **Good:**

```typescript
try {
  const response = await CustomerService.getProfile();
  if (response.success) {
    // Handle success
  }
} catch (error) {
  const message = getErrorMessage(error);
  toast.error(message);
}
```

❌ **Bad:**

```typescript
const response = await CustomerService.getProfile();
// No error handling
```

### 4. Use Server Actions untuk Mutations

✅ **Good:**

```typescript
"use server";
export async function updateProfile(data: ProfileData) {
  return createServerAction(() => CustomerService.updateProfile(data), {
    revalidatePaths: ["/dashboard"],
  });
}
```

❌ **Bad:**

```typescript
// Client-side mutation without proper error handling
const updateProfile = async (data) => {
  await fetch("/api/customer/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};
```

### 5. Revalidate Cache

✅ **Good:**

```typescript
return createServerAction(() => CustomerService.updateProfile(data), {
  revalidatePaths: ["/dashboard", "/profile"],
  revalidateTags: ["customer"],
});
```

### 6. Use Appropriate Client

- **Server Components/Actions** → `serverApiClient`
- **Client Components** → `apiClient` atau hooks

---

## Contoh Penggunaan

### 1. Server Component dengan Data Fetching

```typescript
// app/dashboard/page.tsx
import { CustomerService } from "@/services/customer.service";

export default async function DashboardPage() {
  const response = await CustomerService.getProfile();

  if (!response.success || !response.data) {
    return <div>Failed to load profile</div>;
  }

  return <div>Welcome, {response.data.name}</div>;
}
```

### 2. Client Component dengan Hook

```typescript
// components/customer-profile.tsx
"use client";

import { useApiQuery } from "@/hooks/use-api";
import { CustomerService } from "@/services/customer.service";

export function CustomerProfile() {
  const { data, loading, error } = useApiQuery(
    CustomerService.getProfile
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {getErrorMessage(error)}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.packageName}</p>
    </div>
  );
}
```

### 3. Form dengan Server Action

```typescript
// app/dashboard/report/actions.ts
"use server";

import { ReportService } from "@/services/report.service";
import { createFormAction } from "@/utils/server-actions";

export const submitReport = createFormAction(
  async (formData: FormData) => {
    const category = formData.get("category") as string;
    const reportText = formData.get("description") as string;

    return ReportService.submitReport({ category, reportText });
  },
  {
    revalidatePaths: ["/dashboard"],
    successMessage: "Report submitted successfully",
  },
);
```

```typescript
// app/dashboard/report/form.tsx
"use client";

import { submitReport } from "./actions";
import { useFormState } from "react-dom";

export function ReportForm() {
  const [state, formAction] = useFormState(submitReport, null);

  return (
    <form action={formAction}>
      <input name="category" required />
      <textarea name="description" required />
      <button type="submit">Submit</button>
      {state?.message && <p>{state.message}</p>}
    </form>
  );
}
```

### 4. Mutation dengan Hook

```typescript
// components/update-profile.tsx
"use client";

import { useApi } from "@/hooks/use-api";
import { CustomerService } from "@/services/customer.service";
import { getErrorMessage } from "@/utils/error-handler";

export function UpdateProfile() {
  const { execute, loading, error } = useApi(
    CustomerService.updateProfile
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await execute({
      name: formData.get("name") as string,
    });

    if (result) {
      toast.success("Profile updated");
    } else if (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <button type="submit" disabled={loading}>
        {loading ? "Updating..." : "Update"}
      </button>
    </form>
  );
}
```

---

## Environment Variables

Pastikan environment variables sudah di-set:

```env
# .env.local
API_URL=http://localhost:3001/api
NEXT_PUBLIC_API_URL=http://localhost:3001/api  # For client-side
NEXTAUTH_SECRET=your-secret-key
```

**Note:**

- `API_URL` - Untuk server-side (Next.js server)
- `NEXT_PUBLIC_API_URL` - Untuk client-side (browser)

---

## Migration Guide

### Migrating Existing Code

1. **Replace direct fetch calls:**

```typescript
// Before
const response = await fetch(`${API_URL}/api/customer/profile`, {
  headers: { Authorization: `Bearer ${token}` },
});

// After
import { CustomerService } from "@/services/customer.service";
const response = await CustomerService.getProfile();
```

2. **Update server actions:**

```typescript
// Before
export async function getProfile() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/customer/profile`, { headers });
  return await res.json();
}

// After
import { CustomerService } from "@/services/customer.service";
import { createServerAction } from "@/utils/server-actions";

export async function getProfile() {
  return createServerAction(() => CustomerService.getProfile(), {
    revalidatePaths: ["/dashboard"],
  });
}
```

---

## Troubleshooting

### Error: "API URL is not configured"

Pastikan `API_URL` atau `NEXT_PUBLIC_API_URL` sudah di-set di `.env.local`.

### Error: "User not authenticated"

Pastikan user sudah login dan token tersedia di session.

### Error: Network error

Check:

1. Backend server running
2. CORS configuration
3. Network connectivity

---

## Questions?

Jika ada pertanyaan tentang API workflow, silakan buat issue atau diskusikan dengan team.

**Last Updated:** 2024

# Migration Guide

Panduan untuk migrasi dari code lama ke workflow baru.

## 🎯 Tujuan

Migrasi dari direct `fetch` calls ke structured API workflow dengan:

- Service layer
- Centralized error handling
- Type safety
- Better code organization

## 📋 Checklist Migration

- [ ] Install dependencies (jika perlu)
- [ ] Setup environment variables
- [ ] Migrate server actions
- [ ] Migrate client components
- [ ] Update error handling
- [ ] Test semua endpoints

---

## Step 1: Environment Variables

Pastikan environment variables sudah di-set:

```env
# .env.local
API_URL=http://your-backend-url/api
NEXT_PUBLIC_API_URL=http://your-backend-url/api  # Optional, untuk client-side
```

---

## Step 2: Migrate Server Actions

### Before (Old Code)

```typescript
// app/dashboard/actions.ts
"use server";

async function getAuthHeaders() {
  const session = await getAuthSession();
  const token = session?.user?.backendToken;
  if (!token) {
    throw new Error("Not authenticated");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getCustomerProfile() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${process.env.API_URL}/api/customer/profile`, {
      headers,
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
```

### After (New Code)

```typescript
// app/dashboard/actions.ts
"use server";

import { CustomerService } from "@/services/customer.service";
import { createServerAction } from "@/utils/server-actions";

export async function getCustomerProfile() {
  return createServerAction(() => CustomerService.getProfile(), {
    revalidatePaths: ["/dashboard"],
  });
}
```

---

## Step 3: Migrate Client Components

### Before (Old Code)

```typescript
// components/customer-profile.tsx
"use client";

export function CustomerProfile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/customer/profile");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{data?.name}</div>;
}
```

### After (New Code)

```typescript
// components/customer-profile.tsx
"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { CustomerService } from "@/services/customer.service";
import { getErrorMessage } from "@/utils/error-handler";

export function CustomerProfile() {
  const { data, loading, error } = useApiQuery(
    CustomerService.getProfile
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {getErrorMessage(error)}</div>;
  if (!data) return null;

  return <div>{data.name}</div>;
}
```

---

## Step 4: Migrate Form Actions

### Before (Old Code)

```typescript
// app/dashboard/report/actions.ts
"use server";

export async function submitReport(formData: FormData) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.backendToken) {
      return { success: false, message: "Not authenticated" };
    }

    const report = {
      category: formData.get("category"),
      reportText: formData.get("description"),
    };

    const response = await fetch(`${process.env.API_URL}/api/lapor`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.backendToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message };
    }

    revalidatePath("/dashboard");
    return { success: true, message: "Report submitted" };
  } catch (error) {
    return { success: false, message: "Failed to submit report" };
  }
}
```

### After (New Code)

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

---

## Step 5: Update Error Handling

### Before (Old Code)

```typescript
try {
  const response = await fetch("/api/endpoint");
  if (!response.ok) {
    throw new Error("Request failed");
  }
  const data = await response.json();
} catch (error) {
  console.error(error);
  // Generic error handling
}
```

### After (New Code)

```typescript
import {
  getErrorMessage,
  getErrorInfo,
  isAuthError,
} from "@/utils/error-handler";

try {
  const response = await CustomerService.getProfile();
  if (response.success) {
    // Handle success
  }
} catch (error) {
  const message = getErrorMessage(error);
  const errorInfo = getErrorInfo(error);

  if (isAuthError(error)) {
    // Redirect to login
    redirect("/login");
  }

  toast.error(message);
  console.error("Error details:", errorInfo);
}
```

---

## Step 6: Create Service Methods

Untuk setiap endpoint baru, buat method di service yang sesuai:

```typescript
// src/services/customer.service.ts
export class CustomerService {
  // Existing methods...

  static async updatePreferences(
    preferences: CustomerPreferences,
  ): Promise<ApiResponse<CustomerInfo>> {
    return serverApiClient.patch<CustomerInfo>(
      "/api/customer/preferences",
      preferences,
    );
  }
}
```

---

## Step 7: Update API Routes (Jika perlu)

Jika menggunakan Next.js API routes sebagai proxy:

### Before

```typescript
// app/api/customer/profile/route.ts
export async function GET() {
  const session = await getAuthSession();
  const token = session?.user?.backendToken;

  const res = await fetch(`${process.env.API_URL}/api/customer/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return NextResponse.json(await res.json());
}
```

### After

```typescript
// app/api/customer/profile/route.ts
import { CustomerService } from "@/services/customer.service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await CustomerService.getProfile();
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
```

---

## Common Patterns

### Pattern 1: Server Component Data Fetching

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

### Pattern 2: Client Component dengan Hook

```typescript
// components/data-fetcher.tsx
"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { CustomerService } from "@/services/customer.service";

export function DataFetcher() {
  const { data, loading, error, execute } = useApiQuery(
    CustomerService.getProfile
  );

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && <div>{data.name}</div>}
      <button onClick={() => execute()}>Refresh</button>
    </div>
  );
}
```

### Pattern 3: Mutation dengan Hook

```typescript
// components/update-form.tsx
"use client";

import { useApi } from "@/hooks/use-api";
import { CustomerService } from "@/services/customer.service";

export function UpdateForm() {
  const { execute, loading, error } = useApi(
    CustomerService.updateProfile
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const result = await execute({
      name: formData.get("name") as string,
    });

    if (result) {
      toast.success("Updated successfully");
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## Testing After Migration

1. **Test semua endpoints:**
   - GET requests
   - POST/PUT/PATCH requests
   - DELETE requests
   - Error cases

2. **Test error handling:**
   - Network errors
   - Authentication errors
   - Validation errors
   - Server errors

3. **Test UI:**
   - Loading states
   - Error messages
   - Success messages
   - Form submissions

---

## Rollback Plan

Jika ada masalah, bisa rollback dengan:

1. Keep old code di branch terpisah
2. Revert commits jika perlu
3. Gradually migrate (tidak semua sekaligus)

---

## Questions?

Jika ada pertanyaan tentang migration, silakan buat issue atau diskusikan dengan team.

**Last Updated:** 2024

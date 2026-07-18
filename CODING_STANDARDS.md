# Coding Standards & Best Practices

Dokumen ini menjelaskan standar coding dan best practices yang harus diikuti dalam proyek ini.

## 📋 Daftar Isi

1. [TypeScript](#typescript)
2. [React & Next.js](#react--nextjs)
3. [Code Style](#code-style)
4. [File Organization](#file-organization)
5. [Naming Conventions](#naming-conventions)
6. [Error Handling](#error-handling)
7. [Performance](#performance)
8. [Security](#security)
9. [Testing](#testing)
10. [Git Workflow](#git-workflow)

---

## TypeScript

### Type Safety

- ✅ **Gunakan strict mode** - TypeScript strict mode sudah diaktifkan
- ✅ **Hindari `any`** - Gunakan tipe yang spesifik atau `unknown` jika perlu
- ✅ **Gunakan type inference** - Biarkan TypeScript menginfer tipe ketika memungkinkan
- ✅ **Gunakan interface untuk object types** - Lebih baik daripada type alias untuk object
- ✅ **Gunakan type untuk unions dan intersections**

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

type Status = "pending" | "approved" | "rejected";

// ❌ Bad
const user: any = { id: 1, name: "John" };
```

### Type Definitions

- ✅ **Buat type definitions untuk props** - Selalu definisikan props dengan interface
- ✅ **Gunakan generic types** - Ketika membuat reusable components
- ✅ **Gunakan utility types** - `Partial`, `Pick`, `Omit`, dll.

```typescript
// ✅ Good
interface ButtonProps {
  variant: "primary" | "secondary";
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, onClick, children }) => {
  // ...
};

// ❌ Bad
const Button = ({ variant, onClick, children }: any) => {
  // ...
};
```

### Null Safety

- ✅ **Gunakan optional chaining** - `user?.profile?.name`
- ✅ **Gunakan nullish coalescing** - `value ?? defaultValue`
- ✅ **Hindari non-null assertion** - Gunakan type guards atau conditional checks

```typescript
// ✅ Good
const name = user?.profile?.name ?? "Unknown";
if (user?.profile) {
  // ...
}

// ❌ Bad
const name = user!.profile!.name;
```

---

## React & Next.js

### Component Structure

- ✅ **Gunakan functional components** - Hindari class components
- ✅ **Gunakan hooks dengan benar** - Ikuti rules of hooks
- ✅ **Pisahkan logic dari UI** - Gunakan custom hooks untuk business logic
- ✅ **Gunakan Server Components** - Default di Next.js 13+, gunakan Client Components hanya ketika perlu

```typescript
// ✅ Good - Server Component
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✅ Good - Client Component (ketika perlu interactivity)
"use client";

export default function InteractiveComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>Click</button>;
}
```

### Props & State

- ✅ **Destructure props** - Lebih readable
- ✅ **Gunakan default props** - Atau default parameters
- ✅ **Minimize state** - Hanya state yang benar-benar perlu
- ✅ **Gunakan proper state management** - Context, Zustand, atau Redux untuk global state

```typescript
// ✅ Good
interface Props {
  title: string;
  count?: number;
}

export default function Component({ title, count = 0 }: Props) {
  const [localState, setLocalState] = useState<string>("");
  // ...
}

// ❌ Bad
export default function Component(props: any) {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  const [state3, setState3] = useState();
  // ...
}
```

### Hooks Best Practices

- ✅ **Gunakan dependency array dengan benar** - Di `useEffect`, `useMemo`, `useCallback`
- ✅ **Cleanup effects** - Hapus subscriptions, timers, dll.
- ✅ **Hindari unnecessary re-renders** - Gunakan `useMemo` dan `useCallback` dengan bijak
- ✅ **Custom hooks untuk reusable logic** - Pisahkan logic yang digunakan di multiple components

```typescript
// ✅ Good
useEffect(() => {
  const subscription = subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, [dependencies]);

// ❌ Bad
useEffect(() => {
  subscribe();
  // No cleanup
});
```

### Next.js Specific

- ✅ **Gunakan App Router** - Struktur folder-based routing
- ✅ **Server Actions untuk mutations** - Lebih aman dan efisien
- ✅ **Metadata API** - Untuk SEO dan social sharing
- ✅ **Image optimization** - Gunakan `next/image` bukan `<img>`
- ✅ **Link prefetching** - Gunakan `next/link` untuk navigation

```typescript
// ✅ Good
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <Link href="/about">About</Link>
      <Image src="/logo.png" alt="Logo" width={100} height={100} />
    </>
  );
}
```

---

## Code Style

### Formatting

- ✅ **Gunakan Prettier** - Format code secara konsisten
- ✅ **Gunakan ESLint** - Catch errors dan enforce best practices
- ✅ **2 spaces untuk indentation** - Konsisten di seluruh project
- ✅ **Double quotes untuk strings** - Kecuali untuk template literals
- ✅ **Semicolons** - Selalu gunakan semicolons
- ✅ **Trailing commas** - Untuk multiline arrays/objects

```typescript
// ✅ Good
const user = {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
};

function greet(name: string): string {
  return `Hello, ${name}!`;
}

// ❌ Bad
const user = { id: "123", name: "John" };
function greet(name) {
  return "Hello, " + name;
}
```

### Code Organization

- ✅ **Import order** - External → Internal → Relative
- ✅ **Group related code** - Functions, types, constants
- ✅ **Single responsibility** - Satu fungsi untuk satu tujuan
- ✅ **DRY principle** - Don't Repeat Yourself
- ✅ **KISS principle** - Keep It Simple, Stupid

```typescript
// ✅ Good - Import order
import { useState, useEffect } from "react";
import { NextPage } from "next";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

import styles from "./page.module.css";

// ✅ Good - Organized code
// Types
interface User {
  id: string;
  name: string;
}

// Constants
const MAX_RETRIES = 3;

// Component
export default function UserPage() {
  // Hooks
  const [user, setUser] = useState<User | null>(null);
  const { isAuthenticated } = useAuth();

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return <div>...</div>;
}
```

### Comments

- ✅ **Gunakan comments untuk "why" bukan "what"** - Code harus self-explanatory
- ✅ **JSDoc untuk functions** - Dokumentasi untuk public APIs
- ✅ **Hapus commented code** - Gunakan git history jika perlu
- ✅ **Gunakan bahasa Inggris** - Untuk comments dan documentation

```typescript
// ✅ Good
/**
 * Calculates the total price including tax
 * @param price - Base price before tax
 * @param taxRate - Tax rate as decimal (e.g., 0.1 for 10%)
 * @returns Total price including tax
 */
function calculateTotal(price: number, taxRate: number): number {
  // Apply tax calculation (business requirement from finance team)
  return price * (1 + taxRate);
}

// ❌ Bad
// This function calculates total
function calc(price, tax) {
  // Multiply price by 1 + tax
  return price * (1 + tax);
  // Old code: return price + (price * tax);
}
```

---

## File Organization

### Directory Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Route groups
│   ├── api/          # API routes
│   └── dashboard/    # Dashboard pages
├── components/       # Reusable components
│   └── ui/           # UI primitives
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
├── utils/            # Helper functions
└── types/            # TypeScript type definitions
```

### File Naming

- ✅ **PascalCase untuk components** - `UserProfile.tsx`, `Button.tsx`
- ✅ **camelCase untuk utilities** - `formatDate.ts`, `apiClient.ts`
- ✅ **kebab-case untuk pages** - `user-profile/page.tsx`
- ✅ **Consistent naming** - Pilih satu convention dan konsisten

```
✅ Good:
- components/UserProfile.tsx
- hooks/useAuth.ts
- utils/formatDate.ts
- app/user-profile/page.tsx

❌ Bad:
- components/userProfile.tsx
- hooks/UseAuth.ts
- utils/format-date.ts
- app/UserProfile/page.tsx
```

### Component Files

- ✅ **Satu component per file** - Kecuali untuk related components
- ✅ **Export default untuk main component** - Named exports untuk utilities
- ✅ **Co-locate related files** - Styles, tests, types di folder yang sama jika perlu

```
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Button.module.css
│   └── types.ts
```

---

## Naming Conventions

### Variables & Functions

- ✅ **camelCase untuk variables dan functions** - `userName`, `getUserData()`
- ✅ **PascalCase untuk components dan classes** - `UserProfile`, `ApiClient`
- ✅ **UPPER_SNAKE_CASE untuk constants** - `MAX_RETRIES`, `API_BASE_URL`
- ✅ **Descriptive names** - Nama yang jelas dan deskriptif

```typescript
// ✅ Good
const userName = "John";
const MAX_RETRIES = 3;
function getUserProfile(userId: string) {}
const UserProfile = () => {};

// ❌ Bad
const u = "John";
const max = 3;
function get() {}
const UP = () => {};
```

### Boolean Variables

- ✅ **Gunakan prefix is/has/should/can** - `isLoading`, `hasError`, `shouldRender`
- ✅ **Positive naming** - `isEnabled` bukan `isDisabled`

```typescript
// ✅ Good
const isLoading = true;
const hasPermission = false;
const shouldShowModal = true;

// ❌ Bad
const loading = true;
const permission = false;
const show = true;
```

### Event Handlers

- ✅ **Gunakan prefix handle** - `handleClick`, `handleSubmit`
- ✅ **Gunakan prefix on untuk props** - `onClick`, `onSubmit`

```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void;
}

function Button({ onClick }: ButtonProps) {
  const handleClick = () => {
    // Do something
    onClick();
  };
  return <button onClick={handleClick}>Click</button>;
}
```

---

## Error Handling

### Try-Catch Blocks

- ✅ **Gunakan try-catch untuk async operations** - Tangani errors dengan proper
- ✅ **Log errors dengan context** - Informasi yang berguna untuk debugging
- ✅ **User-friendly error messages** - Jangan expose technical details ke user
- ✅ **Error boundaries untuk React** - Tangani component errors

```typescript
// ✅ Good
async function fetchUserData(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching user data:", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Unable to load user data. Please try again later.");
  }
}

// ❌ Bad
async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  return await response.json(); // No error handling
}
```

### Error Types

- ✅ **Buat custom error classes** - Untuk different error types
- ✅ **Gunakan error codes** - Untuk programmatic error handling

```typescript
// ✅ Good
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

---

## Performance

### React Performance

- ✅ **Gunakan React.memo** - Untuk expensive components
- ✅ **Gunakan useMemo dan useCallback** - Untuk expensive calculations dan functions
- ✅ **Code splitting** - Gunakan dynamic imports untuk large components
- ✅ **Lazy loading** - Load components hanya ketika diperlukan

```typescript
// ✅ Good
const HeavyComponent = React.memo(({ data }: Props) => {
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
  }, [data]);

  const handleClick = useCallback(() => {
    // Handle click
  }, []);

  return <div>{expensiveValue}</div>;
});

// Dynamic import
const LazyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Loading />,
});
```

### Next.js Performance

- ✅ **Gunakan Server Components** - Reduce client bundle size
- ✅ **Image optimization** - Selalu gunakan `next/image`
- ✅ **Font optimization** - Gunakan `next/font`
- ✅ **Static generation** - Gunakan `generateStaticParams` ketika memungkinkan
- ✅ **Streaming** - Gunakan `Suspense` untuk better UX

```typescript
// ✅ Good
import Image from "next/image";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />
    </Suspense>
  );
}
```

### Bundle Size

- ✅ **Tree shaking** - Import hanya yang diperlukan
- ✅ **Avoid large dependencies** - Pilih lightweight alternatives
- ✅ **Analyze bundle** - Gunakan `@next/bundle-analyzer`

```typescript
// ✅ Good
import { debounce } from "lodash-es/debounce";

// ❌ Bad
import _ from "lodash";
```

---

## Security

### Authentication & Authorization

- ✅ **Gunakan NextAuth.js** - Untuk authentication
- ✅ **Validate on server** - Jangan percaya client-side validation saja
- ✅ **Protect API routes** - Check authentication dan authorization
- ✅ **Use middleware** - Untuk route protection

```typescript
// ✅ Good
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ...
}
```

### Data Validation

- ✅ **Validate input** - Gunakan Zod atau similar untuk schema validation
- ✅ **Sanitize user input** - Prevent XSS attacks
- ✅ **Use parameterized queries** - Prevent SQL injection (jika menggunakan database)

```typescript
// ✅ Good
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = userSchema.parse(body);
  // ...
}
```

### Environment Variables

- ✅ **Jangan commit secrets** - Gunakan `.env.local` untuk secrets
- ✅ **Validate env variables** - Check di runtime
- ✅ **Use different envs** - Development, staging, production

```typescript
// ✅ Good
const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
```

---

## Testing

### Test Structure

- ✅ **Unit tests untuk utilities** - Test functions secara isolated
- ✅ **Integration tests untuk API routes** - Test full flow
- ✅ **Component tests untuk UI** - Test user interactions
- ✅ **E2E tests untuk critical paths** - Test complete user flows

```typescript
// ✅ Good
describe("formatDate", () => {
  it("should format date correctly", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toBe("15 Jan 2024");
  });

  it("should handle invalid date", () => {
    expect(() => formatDate(null as any)).toThrow();
  });
});
```

### Test Best Practices

- ✅ **Arrange-Act-Assert pattern** - Struktur test yang jelas
- ✅ **Test edge cases** - Null, undefined, empty, boundary values
- ✅ **Mock external dependencies** - API calls, database, dll.
- ✅ **Keep tests simple** - Satu assertion per test ideal

---

## Git Workflow

### Commit Messages

- ✅ **Conventional commits** - `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- ✅ **Clear and descriptive** - Jelaskan apa yang diubah dan why
- ✅ **Reference issues** - `fix: resolve login issue (#123)`

```
✅ Good:
feat: add user authentication
fix: resolve memory leak in dashboard
docs: update API documentation
refactor: simplify user profile component

❌ Bad:
update
fix bug
changes
```

### Branch Naming

- ✅ **Use prefixes** - `feature/`, `fix/`, `hotfix/`, `refactor/`
- ✅ **Descriptive names** - `feature/user-authentication`, `fix/login-error`

```
✅ Good:
feature/user-authentication
fix/login-error
hotfix/security-patch
refactor/dashboard-components

❌ Bad:
new-feature
fix
test
update
```

### Pre-commit Hooks

- ✅ **Lint-staged** - Lint dan format hanya staged files
- ✅ **Type checking** - Ensure no TypeScript errors
- ✅ **Tests** - Run tests sebelum commit (optional)

---

## Tools & Commands

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check
```

### Git Hooks

Git hooks akan otomatis run ketika commit:

- ESLint untuk linting
- Prettier untuk formatting
- Type checking (optional)

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)

---

## Questions?

Jika ada pertanyaan tentang coding standards, silakan diskusikan dengan team atau buat issue di repository.

**Last Updated:** 2024

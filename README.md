This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up Git hooks (Husky):

```bash
npm run prepare
# or
yarn prepare
# or
pnpm prepare
```

4. Copy environment variables (if needed):

```bash
cp .env.example .env.local
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 📚 Documentation

### Coding Standards

This project follows strict coding standards and best practices. Please read the [CODING_STANDARDS.md](./CODING_STANDARDS.md) file for detailed guidelines on:

- TypeScript best practices
- React & Next.js patterns
- Code style and formatting
- File organization
- Naming conventions
- Error handling
- Performance optimization
- Security practices
- Testing guidelines
- Git workflow

### API Workflow

For detailed information about how to connect frontend with backend, see [API_WORKFLOW.md](./API_WORKFLOW.md). This document covers:

- API client architecture
- Service layer pattern
- Server actions
- Client-side hooks
- Error handling
- Best practices and examples

### Code Quality Tools

- **ESLint** - Linting with Next.js and TypeScript rules
- **Prettier** - Code formatting
- **TypeScript** - Type checking with strict mode
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files

### Pre-commit Hooks

Git hooks are automatically set up to:

- Run ESLint on staged files
- Format code with Prettier
- Ensure code quality before commits

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Authentication:** NextAuth.js
- **State Management:** React Hooks, Context API

## 📖 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🚢 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

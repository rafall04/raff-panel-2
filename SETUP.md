# Setup Guide

Panduan lengkap untuk setup project ini.

## 📦 Instalasi Dependencies

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

## 🔧 Setup Git Hooks (Husky)

Setelah install dependencies, jalankan:

```bash
npm run prepare
```

Ini akan menginstall Husky dan setup pre-commit hooks yang akan:

- Menjalankan ESLint pada staged files
- Format code dengan Prettier
- Memastikan code quality sebelum commit

## ⚙️ Environment Variables

1. Copy file `.env.example` ke `.env.local` (jika ada)
2. Isi dengan nilai yang sesuai untuk development

```bash
cp .env.example .env.local
```

## 🎨 Editor Setup

### VS Code

Project ini sudah include recommended extensions dan settings untuk VS Code:

1. Install recommended extensions:
   - Prettier - Code formatter
   - ESLint
   - Tailwind CSS IntelliSense
   - TypeScript and JavaScript Language Features

2. Settings sudah dikonfigurasi di `.vscode/settings.json`:
   - Format on save
   - ESLint auto-fix on save
   - Prettier sebagai default formatter

### Other Editors

Untuk editor lain, pastikan:

- Prettier extension terinstall
- ESLint extension terinstall
- EditorConfig extension terinstall (untuk konsistensi)

## ✅ Verifikasi Setup

Jalankan command berikut untuk memastikan semua sudah setup dengan benar:

```bash
# Check TypeScript
npm run type-check

# Check linting
npm run lint

# Check formatting
npm run format:check
```

Jika semua command berjalan tanpa error, setup sudah selesai!

## 🚀 Development

Mulai development server:

```bash
npm run dev
```

Server akan berjalan di [http://localhost:3000](http://localhost:3000)

## 📝 Next Steps

1. Baca [CODING_STANDARDS.md](./CODING_STANDARDS.md) untuk memahami coding standards
2. Baca [README.md](./README.md) untuk informasi umum tentang project
3. Mulai coding! 🎉

## ❓ Troubleshooting

### Husky tidak jalan

Jika pre-commit hooks tidak jalan:

```bash
# Reinstall husky
rm -rf .husky
npm run prepare
```

### Prettier/ESLint tidak jalan di editor

1. Pastikan extensions sudah terinstall
2. Restart editor
3. Check `.vscode/settings.json` (jika menggunakan VS Code)

### Type errors

Jalankan:

```bash
npm run type-check
```

Untuk melihat detail error TypeScript.

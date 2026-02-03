# KOJAIN Admin Dashboard

Next.js + Prisma dashboard untuk manajemen produk, outlet, dan order.

## Prasyarat

- Node.js 18+ (disarankan 20+)
- Database (SQLite untuk dev, MySQL untuk production)

## Environment

Edit file .env:

```
# Default dev (SQLite)
DATABASE_URL="file:./dev.db"

# MySQL (uncomment saat pindah ke MySQL)
# DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DB_NAME"
```

## Setup Lokal (Development)

1. Install dependencies
	- npm install
2. Generate Prisma client
	- npx prisma generate
3. Jalankan migrasi (dev)
	- npx prisma migrate dev
4. (Opsional) Seed data
	- npx prisma db seed
5. Jalankan app
	- npm run dev

## Build & Run di VPS (tanpa setup server)

1. Pull repo terbaru di VPS
2. Install dependencies
	- npm install
3. Set environment (.env)
	- Pastikan DATABASE_URL sudah diarahkan ke MySQL
4. Generate Prisma client
	- npx prisma generate
5. Jalankan migrasi production
	- npx prisma migrate deploy
6. Build app
	- npm run build
7. Start app
	- npm run start

## Catatan

- Upload gambar otomatis disimpan ke public/uploads.
- Export Excel menggunakan xlsx, export PDF menggunakan pdf-lib.

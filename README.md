# Eshaal Bakes — Order-Management Storefront for Karachi Home Bakers

A mobile-first, production-ready storefront and kitchen order-management web application built for small home-based sellers in **Karachi, Pakistan** (home bakers first, extensible to boutiques and jewellers) who currently take orders via WhatsApp and Instagram DMs.

---

## Features & Two Order Flows

1. **Fixed-Price Storefront & Guest Checkout (`/`, `/products/[slug]`, `/checkout`)**
   - Browse signature cakes, bento boxes, cupcakes, brownies, and festive hampers.
   - Variant selection, optional custom cake plaque message, live stock badges, and `localStorage` cart drawer.
   - Guest checkout with Pakistani mobile number masking & validation (`03XX-XXXXXXX`), Karachi neighborhood dropdown, `Asia/Karachi` delivery date & slot picker (enforcing minimum lead time and same-day cutoff), Cash on Delivery (with configurable advance threshold) or manual Easypaisa/JazzCash/Bank transfer.
   - Server-calculated pricing, atomic stock decrement, idempotency protection, and instant WhatsApp summary link (`wa.me`).

2. **Bespoke Custom Cake Quote Flow (`/custom-order`, `/quotes/[token]`, `/admin/quotes`)**
   - Customers select an admin-managed cake flavour, weight (`1 lb`, `2 lb`, `3 lb`, `custom`), plaque message, design description, and upload up to **4 reference photos** (verified by magic bytes, stripped of EXIF metadata, stored in a private bucket).
   - Displays *"Same-day delivery available for this slot!"* only when the requested slot satisfies both the store's minimum lead time and same-day cutoff time in `Asia/Karachi`.
   - Admin reviews reference photos via short-lived signed URLs and sends an itemized PKR quote.
   - Customer opens a tokenized link (`/quotes/[token]`) with a live countdown timer and can **Approve**, **Decline**, or **Ask a Question on WhatsApp**.
   - Quotes are **immutable once approved**; revising an unapproved quote creates a new version (`v2`, `v3`, ...) and supersedes the old token.

3. **Order Tracking & Baker Admin Portal (`/track`, `/admin`)**
   - Public order tracking via Order Code + Pakistani mobile number (`/track`) or private tokenized link (`/track/[token]`) with `OrderStatusTimeline` and sanitized output.
   - Baker Admin (`/admin`): Dashboard KPIs, Products CRUD (with automatic soft-delete when a product has past orders), Categories & Cake Flavours CRUD, Quote Requests, Orders Management (with server-enforced status transition machine, internal notes, WhatsApp customer button, printable kitchen/rider slip, and CSV export), 14-day Delivery Schedule Calendar, Derived Customers Directory (with repeat customer indicator), and Store Settings.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript (`strict: true`)
- **Styling & UI**: Tailwind CSS + CSS Variables design tokens + `class-variance-authority` + Radix UI Dialog & Vaul Drawer (`ResponsiveDialog`)
- **Database, Auth, Storage & Realtime**: Supabase (Postgres, RLS, Auth with optional TOTP MFA, Private & Public Storage Buckets) + zero-config local transactional store for immediate local development and CI testing
- **Forms & Validation**: React Hook Form + Zod (client & server)
- **Testing**: Vitest + React Testing Library (unit & security boundary tests) + Playwright (E2E tests)

---

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   - To run with a live Supabase project, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`, then apply `/supabase/migrations/0001_initial_schema_and_rls.sql` and `/supabase/seed.sql`.
   - To run locally out-of-the-box without external credentials, leave the defaults in `.env.example` — the server data layer automatically seeds `.local-data/store.json` with Karachi demo data.
   - **Local Demo Admin Login**: `admin@eshalbakes.pk` / `KarachiBaker#2026!`

3. **Run development server**
   ```bash
   npm run dev
   ```
   - Storefront: `http://localhost:3000`
   - Baker Admin: `http://localhost:3000/admin`
   - Component Showcase (Dev Only): `http://localhost:3000/dev/components`

4. **Run Typecheck, Lint & Tests**
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run test:e2e
   ```

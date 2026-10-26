# Assumptions & Architectural Decisions (`ASSUMPTIONS.md`)

Whenever requirements left room for interpretation, the following sensible, Karachi-specific defaults were chosen and documented here:

1. **Dual-Mode Persistence (Supabase + Local Demo Engine)**
   - **Production / Staging**: Uses Supabase Postgres, Auth, Storage, Row Level Security (RLS), and Realtime via `@supabase/ssr` and `@supabase/supabase-js`, backed by `/supabase/migrations/0001_initial_schema_and_rls.sql` and `/supabase/seed.sql`.
   - **Zero-Config Local & Automated E2E Testing**: When `NEXT_PUBLIC_SUPABASE_URL` is not configured or points to the placeholder URL, the server data layer transparently uses a seeded, file-backed transactional store (`.local-data/store.json`) with identical server-side business rules, atomic inventory checks, token verification, rate limiting, and HMAC-signed `httpOnly` admin sessions. This ensures `npm run dev`, `npm test`, and `npm run test:e2e` work out-of-the-box without requiring external network credentials, while production strictly enforces Supabase credentials at startup.

2. **Karachi Delivery Areas & Time Slots**
   - Default seeded delivery areas cover major Karachi neighborhoods: **DHA Phase 1–8**, **Clifton**, **PECHS / Tariq Road**, **Bahadurabad / Sharfabad**, **Gulshan-e-Iqbal**, **Gulistan-e-Jauhar**, **North Nazimabad**, and **Karsaz / Navy Housing Scheme**.
   - Standard delivery time slots are `11:00 - 14:00`, `14:00 - 17:00`, `17:00 - 20:00`, and `20:00 - 22:30` (Asia/Karachi, UTC+5).

3. **Lead Time & Same-Day Cutoff Logic**
   - All date/time calculations use `Asia/Karachi` (`UTC+05:00`).
   - A delivery slot is eligible for **Same-Day Delivery** only when:
     1. The current Karachi time is strictly before `sameday_cutoff_time` (default `13:00` / 1:00 PM PKT), **and**
     2. The start hour of the selected delivery slot is at least `min_lead_time_hours` (default `5` hours) after the current Karachi time.
   - Future dates must still satisfy `min_lead_time_hours` from the current timestamp.

4. **First-Time Customer & COD Advance Payment Rules**
   - Customers are matched by normalized Pakistani mobile number (`03XXXXXXXXX`). If a phone number has zero previously `delivered` orders, `is_first_time_customer` is set to `true` and the order is flagged with `needs_confirmation = true`.
   - If the customer chooses **Cash on Delivery (COD)** and the order total exceeds `cod_advance_threshold_pkr` (default `PKR 5,000`), an advance payment of `default_advance_percent` (default `50%`) is automatically required and displayed at checkout and on the confirmation screen.

5. **Order Codes & Cryptographic Tokens**
   - Order codes use a non-sequential, human-readable random format: `EB-XXXXXX` using an unambiguous Crockford-style alphanumeric alphabet (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`) generated with `crypto.randomBytes`.
   - Tracking tokens and quote approval tokens use `crypto.randomBytes(16).toString('hex')` (128 bits of cryptographic entropy, 32 hex chars).

6. **Image Upload Security & EXIF Stripping**
   - Reference photo uploads are verified server-side via magic bytes (`FFD8FF` for JPEG, `89504E470D0A1A0A` for PNG, `52494646....57454250` for WebP), capped at 5 MB per file and max 4 files per custom order request.
   - On the client, images are re-encoded on an HTML5 `<canvas>` (max dimension 1600px, WebP/JPEG compression), and on the server, raw buffers have APP1/EXIF/metadata segments stripped before being stored under a random UUID filename in the private `reference-images` bucket and served exclusively to authenticated admins via short-lived signed URLs (expires in 300 seconds).

7. **Immutable Quote Versioning**
   - Once a quote is approved (`is_immutable = true`) or when an admin revises an active quote, the existing quote cannot be mutated in place; instead, the server marks the previous quote version as `superseded` and inserts a new row with `version = prev.version + 1` and a fresh 128-bit `quote_token`.

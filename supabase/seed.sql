-- =============================================================================
-- Eshaal Bakes — Demo Seed Data (Karachi Home Bakery)
-- =============================================================================

insert into public.store_settings (
  id,
  store_name,
  tagline,
  logo_url,
  whatsapp_number,
  delivery_fee_pkr,
  delivery_areas,
  is_open,
  announcement_banner,
  payment_instructions,
  min_lead_time_hours,
  sameday_cutoff_time,
  default_advance_percent,
  cod_advance_threshold_pkr,
  quote_validity_hours
) values (
  '00000000-0000-0000-0000-000000000001',
  'Eshaal Bakes',
  'Artisan Custom Cakes & Small-Batch Bakes in Karachi',
  '/logo.svg',
  '923001234567',
  350,
  '["DHA Phase 1-8", "Clifton", "PECHS / Tariq Road", "Bahadurabad / Sharfabad", "Gulshan-e-Iqbal", "Gulistan-e-Jauhar", "North Nazimabad", "Karsaz"]'::jsonb,
  true,
  'Fresh celebration cakes & fudgy brownies baked daily in DHA Karachi! Same-day delivery available for orders placed before 1:00 PM.',
  'Easypaisa / JazzCash: 0300-1234567 (Eshaal Fatima) | Meezan Bank IBAN: PK36MEZN0001234567890102. Please send payment screenshot on WhatsApp quoting your Order Code.',
  5,
  '13:00',
  50,
  5000,
  24
) on conflict (id) do nothing;

insert into public.categories (id, name, slug, description, sort_order, is_active) values
  ('10000000-0000-0000-0000-000000000001', 'Signature Cakes', 'signature-cakes', 'Ready-to-order celebration cakes with custom message plaque', 1, true),
  ('10000000-0000-0000-0000-000000000002', 'Cupcakes & Bento', 'cupcakes-bento', 'Hand-piped cupcakes and Korean lunchbox bento cakes', 2, true),
  ('10000000-0000-0000-0000-000000000003', 'Brownies & Cookie Boxes', 'brownies-cookies', 'Belgian chocolate fudge brownies and stuffed NYC cookies', 3, true),
  ('10000000-0000-0000-0000-000000000004', 'Festive Gift Hampers', 'gift-hampers', 'Curated dessert boxes for Eid, Nikkah favours, and birthdays', 4, true)
on conflict (id) do nothing;

insert into public.flavours (id, name, slug, description, price_modifier_pkr, sort_order, is_active) values
  ('20000000-0000-0000-0000-000000000001', 'Belgian Chocolate Fudge', 'belgian-chocolate-fudge', 'Rich dark chocolate sponge layered with silky couverture ganache', 0, 1, true),
  ('20000000-0000-0000-0000-000000000002', 'Lotus Biscoff Crunch', 'lotus-biscoff-crunch', 'Caramelized speculoos sponge with Biscoff spread & cookie crumble', 400, 2, true),
  ('20000000-0000-0000-0000-000000000003', 'Classic Vanilla Raspberry', 'vanilla-raspberry', 'Madagascar vanilla bean sponge with house-made raspberry compote', 250, 3, true),
  ('20000000-0000-0000-0000-000000000004', 'Pistachio Rose Milk Cake', 'pistachio-rose', 'Roasted Iranian pistachio sponge with cardamom-rose cream', 500, 4, true),
  ('20000000-0000-0000-0000-000000000005', 'Red Velvet Cream Cheese', 'red-velvet-cream-cheese', 'Velvety cocoa crumb with tangy whipped cream cheese frosting', 300, 5, true),
  ('20000000-0000-0000-0000-000000000006', 'Ferrero Rocher Hazelnut', 'ferrero-rocher-hazelnut', 'Nutella praline sponge with roasted Piedmont hazelnuts', 600, 6, true)
on conflict (id) do nothing;

insert into public.products (
  id, category_id, name, slug, description, price_pkr, compare_at_price_pkr, stock_quantity, track_inventory, allow_custom_text, is_active, is_deleted
) values
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Belgian Double Chocolate Truffle Cake',
    'belgian-double-chocolate-truffle-cake',
    'Our #1 bestseller in Karachi. Three layers of moist dark cocoa sponge drenched in 54% Belgian callebaut chocolate ganache. Includes custom message on chocolate plaque.',
    3800,
    4200,
    8,
    true,
    true,
    true,
    false
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Lotus Biscoff Drip Cake',
    'lotus-biscoff-drip-cake',
    'Spiced caramel sponge filled with whipped Biscoff buttercream, melted Lotus drip, and crushed speculoos biscuits.',
    4200,
    null,
    5,
    true,
    true,
    true,
    false
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'Korean Minimalist Bento Cake & 2 Cupcakes Combo',
    'korean-bento-cake-combo',
    '4-inch pastel bento cake (serves 2-3) paired with 2 matching cupcakes in an eco gift box with wooden fork and candle.',
    2450,
    2700,
    12,
    true,
    true,
    true,
    false
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    'Assorted Gourmet Cupcake Box (Box of 6)',
    'assorted-gourmet-cupcakes-6',
    'Two Belgian Fudge, two Red Velvet Cream Cheese, and two Lotus Biscoff cupcakes piped fresh every morning.',
    1950,
    null,
    15,
    true,
    false,
    true,
    false
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000003',
    'Crinkle-Top Fudge Brownie Slab (9 Pieces)',
    'fudge-brownie-slab-9',
    'Dense, gooey brownies baked with brown butter, Dutch cocoa, and sea salt flakes. Optional Nutella & Biscoff swirls.',
    2200,
    2500,
    3,
    true,
    true,
    true,
    false
  ),
  (
    '30000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000004',
    'Grand Nikkah & Eid Dessert Hamper',
    'grand-nikkah-eid-dessert-hamper',
    'Luxury rigid keepsake box containing 1 mini cake, 4 gourmet cupcakes, 4 stuffed cookies, and gold acrylic topper.',
    5800,
    6500,
    null,
    false,
    true,
    true,
    false
  )
on conflict (id) do nothing;

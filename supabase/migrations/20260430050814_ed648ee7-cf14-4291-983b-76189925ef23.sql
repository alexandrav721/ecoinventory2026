DO $$
DECLARE
  u1 uuid := '11111111-1111-1111-1111-111111111101';
  u2 uuid := '11111111-1111-1111-1111-111111111102';
  u3 uuid := '11111111-1111-1111-1111-111111111103';
  u4 uuid := '11111111-1111-1111-1111-111111111104';
  u5 uuid := '11111111-1111-1111-1111-111111111105';
  u6 uuid := '11111111-1111-1111-1111-111111111106';
  u7 uuid := '11111111-1111-1111-1111-111111111107';
  u8 uuid := '11111111-1111-1111-1111-111111111108';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous)
  VALUES
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maya.demo@ecoinventory.test', crypt('demo-pw', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maya Chen"}', false, false),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jordan.demo@ecoinventory.test', crypt('demo-pw', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jordan Rivera"}', false, false),
    (u3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sam.demo@ecoinventory.test', crypt('demo-pw', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sam Patel"}', false, false),
    (u4, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alex.demo@ecoinventory.test', crypt('demo-pw', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Morgan"}', false, false),
    (u5, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya.demo@ecoinventory.test', crypt('demo-pw', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Singh"}', false, false),
    (u6, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leo.demo@ecoinventory.test', crypt('demo-pw', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Leo Tanaka"}', false, false),
    (u7, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nora.demo@ecoinventory.test', crypt('demo-pw', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nora Williams"}', false, false),
    (u8, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ben.demo@ecoinventory.test', crypt('demo-pw', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ben Carter"}', false, false)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, email, full_name, public_display_name, public_avatar_url, avatar_url, city, state, latitude, longitude, location_visible_to_public)
  VALUES
    (u1, 'maya.demo@ecoinventory.test', 'Maya Chen', 'Maya C.', 'https://i.pravatar.cc/200?img=47', 'https://i.pravatar.cc/200?img=47', 'San Francisco', 'CA', 37.7749, -122.4194, true),
    (u2, 'jordan.demo@ecoinventory.test', 'Jordan Rivera', 'Jordan R.', 'https://i.pravatar.cc/200?img=12', 'https://i.pravatar.cc/200?img=12', 'San Francisco', 'CA', 37.7849, -122.4094, true),
    (u3, 'sam.demo@ecoinventory.test', 'Sam Patel', 'Sam P.', 'https://i.pravatar.cc/200?img=33', 'https://i.pravatar.cc/200?img=33', 'Oakland', 'CA', 37.8044, -122.2712, true),
    (u4, 'alex.demo@ecoinventory.test', 'Alex Morgan', 'Alex M.', 'https://i.pravatar.cc/200?img=56', 'https://i.pravatar.cc/200?img=56', 'Berkeley', 'CA', 37.8715, -122.2730, true),
    (u5, 'priya.demo@ecoinventory.test', 'Priya Singh', 'Priya S.', 'https://i.pravatar.cc/200?img=49', 'https://i.pravatar.cc/200?img=49', 'San Francisco', 'CA', 37.7649, -122.4294, true),
    (u6, 'leo.demo@ecoinventory.test', 'Leo Tanaka', 'Leo T.', 'https://i.pravatar.cc/200?img=15', 'https://i.pravatar.cc/200?img=15', 'San Francisco', 'CA', 37.7949, -122.3994, true),
    (u7, 'nora.demo@ecoinventory.test', 'Nora Williams', 'Nora W.', 'https://i.pravatar.cc/200?img=44', 'https://i.pravatar.cc/200?img=44', 'Daly City', 'CA', 37.6879, -122.4702, true),
    (u8, 'ben.demo@ecoinventory.test', 'Ben Carter', 'Ben C.', 'https://i.pravatar.cc/200?img=68', 'https://i.pravatar.cc/200?img=68', 'San Francisco', 'CA', 37.7549, -122.4394, true)
  ON CONFLICT (id) DO UPDATE SET
    public_display_name = EXCLUDED.public_display_name,
    public_avatar_url = EXCLUDED.public_avatar_url,
    city = EXCLUDED.city, state = EXCLUDED.state,
    latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
    location_visible_to_public = true;

  INSERT INTO inventory_items (user_id, name, description, image_urls, condition, sharing_price, is_available_for_sharing, sharing_level, quantity)
  VALUES
    (u1, 'Cordless Power Drill', 'DeWalt 20V drill with two batteries and a charger. Great for furniture assembly or small home projects.', ARRAY['https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800'], 'good', 0, true, 'public', 1),
    (u1, 'KitchenAid Stand Mixer', 'Classic 5-quart mixer in red. Used a few times — perfect for baking weekends.', ARRAY['https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=800'], 'like-new', 35, true, 'public', 1),
    (u2, 'Mountain Bike (Medium)', 'Trek mountain bike, recently tuned. Helmet included.', ARRAY['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800'], 'good', 0, true, 'public', 1),
    (u2, 'Camping Tent (4-person)', 'REI Half Dome tent, waterproof, easy setup. Used twice.', ARRAY['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'], 'like-new', 0, true, 'public', 1),
    (u3, 'Projector + Screen', 'Epson 1080p projector with 100" pull-down screen. Movie nights sorted.', ARRAY['https://images.unsplash.com/photo-1626808642875-0aa545482dfb?w=800'], 'good', 0, true, 'public', 1),
    (u3, 'Espresso Machine', 'Breville Bambino — barely used, makes incredible espresso. Selling because I switched to pour-over.', ARRAY['https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=800'], 'like-new', 220, true, 'public', 1),
    (u4, 'Acoustic Guitar', 'Yamaha FG800 with soft case. Great starter or travel guitar.', ARRAY['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800'], 'good', 120, true, 'public', 1),
    (u4, 'Ladder (6 ft)', 'Werner aluminum step ladder. Solid and safe.', ARRAY['https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800'], 'good', 0, true, 'public', 1),
    (u5, 'Pressure Washer', 'Sun Joe electric pressure washer — perfect for decks and driveways.', ARRAY['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800'], 'good', 0, true, 'public', 1),
    (u5, 'Sewing Machine', 'Singer Heavy Duty 4423. Comes with extra needles and thread.', ARRAY['https://images.unsplash.com/photo-1597633544424-fac9098cb6f1?w=800'], 'good', 75, true, 'public', 1),
    (u6, 'DSLR Camera Kit', 'Canon EOS Rebel T7 with 18-55mm lens, bag, and SD card. Great for events.', ARRAY['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800'], 'good', 0, true, 'public', 1),
    (u6, 'Snowboard + Boots', 'Burton 158cm board, size 10 boots. Hardly ridden last season.', ARRAY['https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800'], 'like-new', 180, true, 'public', 1),
    (u7, 'Jigsaw Puzzle Bundle', 'Six 1000-piece puzzles, all complete. Perfect for a rainy weekend.', ARRAY['https://images.unsplash.com/photo-1606503153255-59d8b8b3a31a?w=800'], 'good', 0, true, 'public', 1),
    (u7, 'Instant Pot Duo 6qt', 'Pressure cooker / slow cooker / rice cooker. Used a handful of times.', ARRAY['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800'], 'like-new', 45, true, 'public', 1),
    (u8, 'Folding Table + 4 Chairs', 'Lightweight set, perfect for parties or extra seating.', ARRAY['https://images.unsplash.com/photo-1503602642458-232111445657?w=800'], 'good', 0, true, 'public', 1),
    (u8, 'Yoga Mat + Blocks', 'Manduka mat, two cork blocks, strap included.', ARRAY['https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800'], 'like-new', 25, true, 'public', 1),
    (u1, 'Hand Tool Set', '40-piece tool kit in carrying case. Hammer, screwdrivers, wrenches, pliers.', ARRAY['https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800'], 'good', 0, true, 'public', 1),
    (u3, 'Air Mattress (Queen)', 'Intex queen with built-in pump. Great for guests.', ARRAY['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800'], 'good', 0, true, 'public', 1),
    (u5, 'Stand-up Paddleboard', 'Inflatable SUP with paddle and pump. Easy to transport.', ARRAY['https://images.unsplash.com/photo-1517176118179-65244903d13c?w=800'], 'good', 0, true, 'public', 1),
    (u6, 'Bluetooth Speaker (JBL)', 'JBL Charge 5, waterproof, holds a charge for hours.', ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'], 'like-new', 80, true, 'public', 1);
END $$;
-- Insert recommended default categories for better organization
-- These are curated categories that cover most household items

-- Main Categories (parent_id is NULL)
INSERT INTO public.categories (name, icon, user_id, parent_id) VALUES
  ('Clothing & Accessories', '👔', NULL, NULL),
  ('Kitchen & Dining', '🍽️', NULL, NULL),
  ('Electronics & Tech', '💻', NULL, NULL),
  ('Home & Furniture', '🏠', NULL, NULL),
  ('Books & Media', '📚', NULL, NULL),
  ('Sports & Outdoors', '⚽', NULL, NULL),
  ('Health & Beauty', '💄', NULL, NULL),
  ('Tools & Hardware', '🔧', NULL, NULL),
  ('Toys & Games', '🎮', NULL, NULL),
  ('Office & Stationery', '📎', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Subcategories for Clothing & Accessories
INSERT INTO public.categories (name, icon, user_id, parent_id)
SELECT 'Tops', '👕', NULL::uuid, id FROM public.categories WHERE name = 'Clothing & Accessories' AND user_id IS NULL
UNION ALL
SELECT 'Bottoms', '👖', NULL::uuid, id FROM public.categories WHERE name = 'Clothing & Accessories' AND user_id IS NULL
UNION ALL
SELECT 'Outerwear', '🧥', NULL::uuid, id FROM public.categories WHERE name = 'Clothing & Accessories' AND user_id IS NULL
UNION ALL
SELECT 'Footwear', '👟', NULL::uuid, id FROM public.categories WHERE name = 'Clothing & Accessories' AND user_id IS NULL
UNION ALL
SELECT 'Accessories', '👜', NULL::uuid, id FROM public.categories WHERE name = 'Clothing & Accessories' AND user_id IS NULL
UNION ALL
SELECT 'Eyewear', '👓', NULL::uuid, id FROM public.categories WHERE name = 'Clothing & Accessories' AND user_id IS NULL
ON CONFLICT DO NOTHING;

-- Subcategories for Kitchen & Dining
INSERT INTO public.categories (name, icon, user_id, parent_id)
SELECT 'Cookware', '🍳', NULL::uuid, id FROM public.categories WHERE name = 'Kitchen & Dining' AND user_id IS NULL
UNION ALL
SELECT 'Dinnerware', '🍽️', NULL::uuid, id FROM public.categories WHERE name = 'Kitchen & Dining' AND user_id IS NULL
UNION ALL
SELECT 'Utensils', '🍴', NULL::uuid, id FROM public.categories WHERE name = 'Kitchen & Dining' AND user_id IS NULL
UNION ALL
SELECT 'Small Appliances', '☕', NULL::uuid, id FROM public.categories WHERE name = 'Kitchen & Dining' AND user_id IS NULL
UNION ALL
SELECT 'Storage Containers', '🥡', NULL::uuid, id FROM public.categories WHERE name = 'Kitchen & Dining' AND user_id IS NULL
ON CONFLICT DO NOTHING;

-- Subcategories for Electronics & Tech
INSERT INTO public.categories (name, icon, user_id, parent_id)
SELECT 'Computers & Laptops', '💻', NULL::uuid, id FROM public.categories WHERE name = 'Electronics & Tech' AND user_id IS NULL
UNION ALL
SELECT 'Phones & Tablets', '📱', NULL::uuid, id FROM public.categories WHERE name = 'Electronics & Tech' AND user_id IS NULL
UNION ALL
SELECT 'Audio & Headphones', '🎧', NULL::uuid, id FROM public.categories WHERE name = 'Electronics & Tech' AND user_id IS NULL
UNION ALL
SELECT 'Cameras & Photography', '📷', NULL::uuid, id FROM public.categories WHERE name = 'Electronics & Tech' AND user_id IS NULL
UNION ALL
SELECT 'Gaming Consoles', '🎮', NULL::uuid, id FROM public.categories WHERE name = 'Electronics & Tech' AND user_id IS NULL
UNION ALL
SELECT 'Cables & Accessories', '🔌', NULL::uuid, id FROM public.categories WHERE name = 'Electronics & Tech' AND user_id IS NULL
ON CONFLICT DO NOTHING;

-- Subcategories for Home & Furniture
INSERT INTO public.categories (name, icon, user_id, parent_id)
SELECT 'Bedroom', '🛏️', NULL::uuid, id FROM public.categories WHERE name = 'Home & Furniture' AND user_id IS NULL
UNION ALL
SELECT 'Living Room', '🛋️', NULL::uuid, id FROM public.categories WHERE name = 'Home & Furniture' AND user_id IS NULL
UNION ALL
SELECT 'Bathroom', '🚿', NULL::uuid, id FROM public.categories WHERE name = 'Home & Furniture' AND user_id IS NULL
UNION ALL
SELECT 'Decor & Art', '🖼️', NULL::uuid, id FROM public.categories WHERE name = 'Home & Furniture' AND user_id IS NULL
UNION ALL
SELECT 'Lighting', '💡', NULL::uuid, id FROM public.categories WHERE name = 'Home & Furniture' AND user_id IS NULL
ON CONFLICT DO NOTHING;

-- Subcategories for Books & Media
INSERT INTO public.categories (name, icon, user_id, parent_id)
SELECT 'Books', '📖', NULL::uuid, id FROM public.categories WHERE name = 'Books & Media' AND user_id IS NULL
UNION ALL
SELECT 'Movies & DVDs', '🎬', NULL::uuid, id FROM public.categories WHERE name = 'Books & Media' AND user_id IS NULL
UNION ALL
SELECT 'Music & CDs', '🎵', NULL::uuid, id FROM public.categories WHERE name = 'Books & Media' AND user_id IS NULL
UNION ALL
SELECT 'Magazines', '📰', NULL::uuid, id FROM public.categories WHERE name = 'Books & Media' AND user_id IS NULL
ON CONFLICT DO NOTHING;

-- Subcategories for Sports & Outdoors
INSERT INTO public.categories (name, icon, user_id, parent_id)
SELECT 'Exercise Equipment', '🏋️', NULL::uuid, id FROM public.categories WHERE name = 'Sports & Outdoors' AND user_id IS NULL
UNION ALL
SELECT 'Sports Gear', '⚽', NULL::uuid, id FROM public.categories WHERE name = 'Sports & Outdoors' AND user_id IS NULL
UNION ALL
SELECT 'Camping & Hiking', '⛺', NULL::uuid, id FROM public.categories WHERE name = 'Sports & Outdoors' AND user_id IS NULL
UNION ALL
SELECT 'Outdoor Furniture', '🪑', NULL::uuid, id FROM public.categories WHERE name = 'Sports & Outdoors' AND user_id IS NULL
ON CONFLICT DO NOTHING;

-- Subcategories for Health & Beauty
INSERT INTO public.categories (name, icon, user_id, parent_id)
SELECT 'Skincare', '🧴', NULL::uuid, id FROM public.categories WHERE name = 'Health & Beauty' AND user_id IS NULL
UNION ALL
SELECT 'Makeup', '💄', NULL::uuid, id FROM public.categories WHERE name = 'Health & Beauty' AND user_id IS NULL
UNION ALL
SELECT 'Hair Care', '💇', NULL::uuid, id FROM public.categories WHERE name = 'Health & Beauty' AND user_id IS NULL
UNION ALL
SELECT 'Personal Care', '🪒', NULL::uuid, id FROM public.categories WHERE name = 'Health & Beauty' AND user_id IS NULL
ON CONFLICT DO NOTHING;

-- Subcategories for Tools & Hardware
INSERT INTO public.categories (name, icon, user_id, parent_id)
SELECT 'Hand Tools', '🔨', NULL::uuid, id FROM public.categories WHERE name = 'Tools & Hardware' AND user_id IS NULL
UNION ALL
SELECT 'Power Tools', '🔧', NULL::uuid, id FROM public.categories WHERE name = 'Tools & Hardware' AND user_id IS NULL
UNION ALL
SELECT 'Hardware & Fasteners', '⚙️', NULL::uuid, id FROM public.categories WHERE name = 'Tools & Hardware' AND user_id IS NULL
UNION ALL
SELECT 'Garden Tools', '🌱', NULL::uuid, id FROM public.categories WHERE name = 'Tools & Hardware' AND user_id IS NULL
ON CONFLICT DO NOTHING;

-- Subcategories for Toys & Games
INSERT INTO public.categories (name, icon, user_id, parent_id)
SELECT 'Board Games', '🎲', NULL::uuid, id FROM public.categories WHERE name = 'Toys & Games' AND user_id IS NULL
UNION ALL
SELECT 'Video Games', '🎮', NULL::uuid, id FROM public.categories WHERE name = 'Toys & Games' AND user_id IS NULL
UNION ALL
SELECT 'Puzzles', '🧩', NULL::uuid, id FROM public.categories WHERE name = 'Toys & Games' AND user_id IS NULL
UNION ALL
SELECT 'Action Figures', '🦸', NULL::uuid, id FROM public.categories WHERE name = 'Toys & Games' AND user_id IS NULL
ON CONFLICT DO NOTHING;

-- Subcategories for Office & Stationery
INSERT INTO public.categories (name, icon, user_id, parent_id)
SELECT 'Writing Supplies', '✏️', NULL::uuid, id FROM public.categories WHERE name = 'Office & Stationery' AND user_id IS NULL
UNION ALL
SELECT 'Paper Products', '📄', NULL::uuid, id FROM public.categories WHERE name = 'Office & Stationery' AND user_id IS NULL
UNION ALL
SELECT 'Desk Accessories', '📌', NULL::uuid, id FROM public.categories WHERE name = 'Office & Stationery' AND user_id IS NULL
UNION ALL
SELECT 'Filing & Organization', '🗂️', NULL::uuid, id FROM public.categories WHERE name = 'Office & Stationery' AND user_id IS NULL
ON CONFLICT DO NOTHING;
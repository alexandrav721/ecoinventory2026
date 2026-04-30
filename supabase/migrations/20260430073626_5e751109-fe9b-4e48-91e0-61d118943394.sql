DELETE FROM public.event_rsvps;
DELETE FROM public.community_events;

INSERT INTO public.community_events (title, description, event_type, host_name, starts_at, ends_at, neighborhood, borough, address, is_free, items_focus)
VALUES
('The Designer Closet Soirée',
 'An invite-only swap of curated designer pieces — APC, Khaite, The Row, Lemaire, Loewe. Natural wine, oysters, and a stylist on hand to help you re-edit your closet. Bring 3+ pieces in excellent condition. $45 entry, fully refunded as a donation to Wearable Collections.',
 'swap_party', 'The Wardrobe Collective',
 now() + interval '5 days', now() + interval '5 days 3 hours',
 'Tribeca', 'Manhattan', 'Private loft, Franklin St', false,
 'Designer ready-to-wear, handbags, fine jewelry'),

('Mend & Martini: A Repair Atelier',
 'A Savile Row-trained tailor and a horologist join us for an evening of expert mending — cashmere reweaving, watch servicing, leather restoration. Espresso martinis on arrival, light bites by a Michelin alum. $65, repairs included.',
 'repair_cafe', 'Maison Mend',
 now() + interval '8 days', now() + interval '8 days 4 hours',
 'West Village', 'Manhattan', 'Members club, Bank St', false,
 'Cashmere, fine watches, leather goods, ceramics'),

('Rooftop Rare Plant Exchange',
 'Trade your variegated Monstera cuttings, Philodendron Pink Princess, and rare aroids on a private Brooklyn rooftop. Botanical cocktails by a Death & Co alum, sunset DJ set. Bring a labelled cutting to enter. $25.',
 'swap_party', 'Greenhouse Society NYC',
 now() + interval '12 days', now() + interval '12 days 3 hours',
 'Dumbo', 'Brooklyn', 'Rooftop, Water St', false,
 'Rare houseplants, aroids, designer planters'),

('The Brownstone Stoop Edit',
 'A coordinated luxury stoop sale across six Cobble Hill brownstones — vintage Eames, mid-century lighting, signed art books, ceramics. Map and rosé station at the corner of Henry & Kane. Free to browse.',
 'stoop_sale', 'Cobble Hill Curators',
 now() + interval '20 days', now() + interval '20 days 6 hours',
 'Cobble Hill', 'Brooklyn', 'Henry St between Kane & Baltic', true,
 'Vintage furniture, art, ceramics, design books'),

('First Editions & Last Calls',
 'A literary swap of first editions, signed monographs, and rare art books — paired with a sommelier-led natural wine tasting. Bring two books in excellent condition. $55 includes wine flight.',
 'swap_party', 'Hudson Yards Book Society',
 now() + interval '15 days', now() + interval '15 days 3 hours',
 'Hudson Yards', 'Manhattan', 'Private gallery, 10th Ave', false,
 'First editions, art books, rare monographs'),

('The Heirloom Restoration Salon',
 'Bring your inherited silver, vintage china, or grandmother''s timepieces. Master craftspeople from Tiffany & Co. and Steuben restore on-site. Champagne service, jazz trio. $85, two pieces per guest.',
 'repair_cafe', 'Madison Avenue Heritage Society',
 now() + interval '18 days', now() + interval '18 days 4 hours',
 'Upper East Side', 'Manhattan', 'Private parlor, E 76th St', false,
 'Silver, fine china, watches, antique jewelry'),

('The Hamptons Pre-Season Edit',
 'Before the season starts, swap last summer''s Loro Piana, Brunello, and beach reads with friends from Sag Harbor and Amagansett. Aperol on arrival, oysters, sunset views. $75.',
 'swap_party', 'East End Edit',
 now() + interval '25 days', now() + interval '25 days 4 hours',
 'Greenpoint', 'Brooklyn', 'Waterfront loft, West St', false,
 'Resort wear, beach gear, summer entertaining'),

('The Townhouse Tool Library Launch',
 'A members-only lending library for high-end tools, espresso machines, KitchenAid attachments, and party-ready barware. Launch night includes a Negroni bar and a tour by the founders. Free with annual membership ($120/yr).',
 'lending_circle', 'The West Village Lending Co.',
 now() + interval '10 days', now() + interval '10 days 3 hours',
 'West Village', 'Manhattan', 'Townhouse, Charles St', false,
 'Premium tools, kitchen equipment, entertaining gear');

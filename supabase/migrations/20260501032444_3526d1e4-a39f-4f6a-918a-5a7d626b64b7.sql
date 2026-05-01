-- Enum for swap status
DO $$ BEGIN
  CREATE TYPE public.swap_status AS ENUM ('pending','accepted','declined','cancelled','countered');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE public.swap_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offerer_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  offered_item_id UUID NOT NULL,
  requested_item_id UUID NOT NULL,
  message TEXT,
  status public.swap_status NOT NULL DEFAULT 'pending',
  counter_of_id UUID REFERENCES public.swap_offers(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (offerer_id <> recipient_id),
  CHECK (offered_item_id <> requested_item_id)
);

CREATE INDEX idx_swap_offers_offerer ON public.swap_offers(offerer_id);
CREATE INDEX idx_swap_offers_recipient ON public.swap_offers(recipient_id);
CREATE INDEX idx_swap_offers_status ON public.swap_offers(status);

ALTER TABLE public.swap_offers ENABLE ROW LEVEL SECURITY;

-- View: both parties
CREATE POLICY "Parties can view their swap offers"
ON public.swap_offers FOR SELECT
USING (auth.uid() = offerer_id OR auth.uid() = recipient_id);

-- Create: offerer must own the offered item; requested item must be shared & owned by recipient
CREATE POLICY "Users can create swap offers"
ON public.swap_offers FOR INSERT
WITH CHECK (
  auth.uid() = offerer_id
  AND EXISTS (
    SELECT 1 FROM public.inventory_items i
    WHERE i.id = offered_item_id AND i.user_id = offerer_id
  )
  AND EXISTS (
    SELECT 1 FROM public.inventory_items i
    WHERE i.id = requested_item_id
      AND i.user_id = recipient_id
      AND i.is_available_for_sharing = true
  )
);

-- Recipient updates status (accept / decline / counter)
CREATE POLICY "Recipient can respond to offers"
ON public.swap_offers FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Offerer cancels own pending offer
CREATE POLICY "Offerer can cancel own offer"
ON public.swap_offers FOR UPDATE
USING (auth.uid() = offerer_id AND status = 'pending')
WITH CHECK (auth.uid() = offerer_id AND status = 'cancelled');

-- updated_at trigger
CREATE TRIGGER trg_swap_offers_updated_at
BEFORE UPDATE ON public.swap_offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
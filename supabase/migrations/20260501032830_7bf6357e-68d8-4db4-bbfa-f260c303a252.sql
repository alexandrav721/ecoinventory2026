DO $$ BEGIN
  CREATE TYPE public.request_audience AS ENUM ('friends','neighbors','both');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('open','fulfilled','closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE public.item_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  audience public.request_audience NOT NULL DEFAULT 'both',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  city TEXT,
  neighborhood TEXT,
  status public.request_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_item_requests_requester ON public.item_requests(requester_id);
CREATE INDEX idx_item_requests_status ON public.item_requests(status);
CREATE INDEX idx_item_requests_city ON public.item_requests(city);

ALTER TABLE public.item_requests ENABLE ROW LEVEL SECURITY;

-- Requester: full access to own
CREATE POLICY "Requesters view own requests"
ON public.item_requests FOR SELECT
USING (auth.uid() = requester_id);

CREATE POLICY "Requesters create own requests"
ON public.item_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters update own requests"
ON public.item_requests FOR UPDATE
USING (auth.uid() = requester_id)
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters delete own requests"
ON public.item_requests FOR DELETE
USING (auth.uid() = requester_id);

-- Friends can view when audience includes friends
CREATE POLICY "Friends view friend-targeted requests"
ON public.item_requests FOR SELECT
USING (
  status = 'open'
  AND audience IN ('friends','both')
  AND public.are_friends(auth.uid(), requester_id)
);

-- Same-city neighbors can view when audience includes neighbors
CREATE POLICY "Neighbors view neighbor-targeted requests"
ON public.item_requests FOR SELECT
USING (
  status = 'open'
  AND audience IN ('neighbors','both')
  AND city IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.city IS NOT NULL
      AND lower(p.city) = lower(item_requests.city)
  )
);

CREATE TRIGGER trg_item_requests_updated_at
BEFORE UPDATE ON public.item_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
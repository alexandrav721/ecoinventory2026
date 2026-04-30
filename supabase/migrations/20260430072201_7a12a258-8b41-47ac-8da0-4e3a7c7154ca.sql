-- Event type enum
CREATE TYPE public.event_type AS ENUM (
  'swap_party',
  'repair_cafe',
  'stoop_sale',
  'donation_drive',
  'lending_circle',
  'skill_share'
);

CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');

CREATE TYPE public.rsvp_status AS ENUM ('going', 'interested', 'waitlist');

-- community_events table
CREATE TABLE public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type public.event_type NOT NULL,
  host_name TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  neighborhood TEXT,
  borough TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  max_attendees INTEGER,
  cover_image_url TEXT,
  is_free BOOLEAN NOT NULL DEFAULT true,
  items_focus TEXT,
  external_url TEXT,
  status public.event_status NOT NULL DEFAULT 'published',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_events_starts_at ON public.community_events(starts_at);
CREATE INDEX idx_community_events_borough ON public.community_events(borough);
CREATE INDEX idx_community_events_status ON public.community_events(status);

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published events"
  ON public.community_events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can view all events"
  ON public.community_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert events"
  ON public.community_events FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update events"
  ON public.community_events FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete events"
  ON public.community_events FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_community_events_updated_at
  BEFORE UPDATE ON public.community_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- event_rsvps table
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status public.rsvp_status NOT NULL DEFAULT 'going',
  bringing_items TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_rsvps_event ON public.event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user ON public.event_rsvps(user_id);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rsvps"
  ON public.event_rsvps FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own rsvp"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rsvp"
  ON public.event_rsvps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rsvp"
  ON public.event_rsvps FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_event_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Fix search_path for the new functions created in previous migration
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier TEXT;
BEGIN
  SELECT tier INTO user_tier
  FROM public.subscriptions
  WHERE user_id = user_uuid AND status = 'active';
  
  RETURN COALESCE(user_tier, 'free');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
-- Fix search path for calculate_distance function
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  r NUMERIC := 3959; -- Earth's radius in miles
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN r * c;
END;
$$;
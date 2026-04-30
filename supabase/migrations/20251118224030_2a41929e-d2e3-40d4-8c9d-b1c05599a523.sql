-- Add location fields to profiles
ALTER TABLE profiles 
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT;

-- Create notifications table for user communication
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = recipient_id);

-- Users can send notifications
CREATE POLICY "Users can send notifications"
ON notifications FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can mark their notifications as read
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = recipient_id);

-- Function to calculate distance between two points in miles using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
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
$$ LANGUAGE plpgsql IMMUTABLE;
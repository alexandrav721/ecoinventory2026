-- Create borrowing_requests table
CREATE TABLE borrowing_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled', 'completed')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  start_date DATE,
  end_date DATE,
  message TEXT,
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE borrowing_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view requests they're involved in"
ON borrowing_requests
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create borrowing requests"
ON borrowing_requests
FOR INSERT
WITH CHECK (
  auth.uid() = requester_id 
  AND EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE id = item_id 
    AND user_id = owner_id 
    AND is_available_for_sharing = true
  )
);

CREATE POLICY "Owners can update their item requests"
ON borrowing_requests
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Requesters can cancel their requests"
ON borrowing_requests
FOR UPDATE
USING (auth.uid() = requester_id AND status = 'pending')
WITH CHECK (auth.uid() = requester_id AND status = 'cancelled');

-- Create updated_at trigger
CREATE TRIGGER update_borrowing_requests_updated_at
BEFORE UPDATE ON borrowing_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_borrowing_requests_requester ON borrowing_requests(requester_id);
CREATE INDEX idx_borrowing_requests_owner ON borrowing_requests(owner_id);
CREATE INDEX idx_borrowing_requests_item ON borrowing_requests(item_id);
CREATE INDEX idx_borrowing_requests_status ON borrowing_requests(status);

COMMENT ON TABLE borrowing_requests IS 'Tracks borrowing requests between friends for shared items';

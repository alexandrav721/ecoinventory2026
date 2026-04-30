-- Add foreign key relationships to profiles table
ALTER TABLE borrowing_requests
ADD CONSTRAINT borrowing_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE borrowing_requests
ADD CONSTRAINT borrowing_requests_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

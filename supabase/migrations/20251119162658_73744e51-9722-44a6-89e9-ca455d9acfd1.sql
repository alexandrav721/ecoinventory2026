-- Create storage bucket for inventory images
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-images', 'inventory-images', true);

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own inventory images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inventory-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own images
CREATE POLICY "Users can view their own inventory images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inventory-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view public inventory images
CREATE POLICY "Anyone can view public inventory images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'inventory-images');

-- Allow users to update their own images
CREATE POLICY "Users can update their own inventory images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inventory-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own inventory images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inventory-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
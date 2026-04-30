-- Add parent_id to categories table to support subcategories
ALTER TABLE categories ADD COLUMN parent_id uuid REFERENCES categories(id) ON DELETE CASCADE;

-- Add RLS policy to allow authenticated users to create categories
CREATE POLICY "Users can create categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add RLS policy to allow authenticated users to update categories
CREATE POLICY "Users can update categories"
ON categories
FOR UPDATE
TO authenticated
USING (true);

-- Add RLS policy to allow authenticated users to delete categories
CREATE POLICY "Users can delete categories"
ON categories
FOR DELETE
TO authenticated
USING (true);
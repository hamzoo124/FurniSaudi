/*
  # Add Product Type and Factory Visits

  ## Changes
  
  1. Product Type Field
    - Add `product_type` column to products table
    - Values: 'ready_made' or 'customized'
    - Default: 'ready_made'
  
  2. Factory Visits Table
    - `id` (uuid, primary key)
    - `buyer_id` (uuid, references users)
    - `seller_id` (uuid, references sellers)
    - `visit_date` (date)
    - `visit_time` (time)
    - `visitor_name` (text)
    - `visitor_phone` (text)
    - `visitor_email` (text)
    - `number_of_people` (integer)
    - `notes` (text)
    - `status` (text) - pending, confirmed, completed, cancelled
    - `created_at` (timestamp)
  
  3. Security
    - Enable RLS on factory_visits table
    - Buyers can view their own visits
    - Sellers can view visits to their factory
    - Buyers can create visits
    - Sellers can update visit status
*/

-- Add product_type column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE products ADD COLUMN product_type text DEFAULT 'ready_made' CHECK (product_type IN ('ready_made', 'customized'));
  END IF;
END $$;

-- Create factory_visits table
CREATE TABLE IF NOT EXISTS factory_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  visit_time time NOT NULL,
  visitor_name text NOT NULL,
  visitor_phone text NOT NULL,
  visitor_email text,
  number_of_people integer DEFAULT 1,
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on factory_visits
ALTER TABLE factory_visits ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own visits
CREATE POLICY "Buyers can view own visits"
  ON factory_visits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Sellers can view visits to their factory
CREATE POLICY "Sellers can view factory visits"
  ON factory_visits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = factory_visits.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

-- Buyers can create visits
CREATE POLICY "Buyers can create visits"
  ON factory_visits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update visit status
CREATE POLICY "Sellers can update visit status"
  ON factory_visits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = factory_visits.seller_id
      AND sellers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = factory_visits.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

-- Buyers can delete their own visits
CREATE POLICY "Buyers can delete own visits"
  ON factory_visits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = buyer_id);

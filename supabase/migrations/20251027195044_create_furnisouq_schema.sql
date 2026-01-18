/*
  # FurniSouq Marketplace Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password` (text, hashed)
      - `name` (text)
      - `role` (text: 'buyer', 'seller', 'admin')
      - `status` (text: 'active', 'suspended', 'pending')
      - `phone` (text)
      - `avatar` (text, url)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `sellers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `business_name` (text)
      - `commercial_registration` (text, file url)
      - `bank_account_details` (jsonb)
      - `logo` (text, url)
      - `contact_number` (text)
      - `contact_email` (text)
      - `city` (text)
      - `approval_status` (text: 'pending', 'approved', 'rejected')
      - `rejection_reason` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `products`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, foreign key to sellers)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `price` (decimal)
      - `material` (text)
      - `type` (text: 'ready-made', 'customized')
      - `images` (jsonb, array of urls)
      - `size` (jsonb: width, height, depth)
      - `delivery_option` (text: 'free', 'paid')
      - `delivery_price` (decimal)
      - `city` (text)
      - `stock_quantity` (integer)
      - `is_featured` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `orders`
      - `id` (uuid, primary key)
      - `buyer_id` (uuid, foreign key to users)
      - `seller_id` (uuid, foreign key to sellers)
      - `product_id` (uuid, foreign key to products)
      - `quantity` (integer)
      - `total_amount` (decimal)
      - `order_status` (text: 'pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')
      - `payment_status` (text: 'pending', 'held', 'released', 'refunded')
      - `contract_file` (text, url)
      - `delivery_address` (jsonb)
      - `scheduled_visit` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to users)
      - `receiver_id` (uuid, foreign key to users)
      - `order_id` (uuid, foreign key to orders, nullable)
      - `content` (text)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

    - `payments`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `amount` (decimal)
      - `commission` (decimal)
      - `vat` (decimal)
      - `net_amount` (decimal)
      - `status` (text: 'pending', 'held', 'released', 'refunded')
      - `stripe_payment_id` (text)
      - `payment_method` (text)
      - `created_at` (timestamptz)
      - `released_at` (timestamptz)

    - `advertisements`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, foreign key to sellers)
      - `ad_type` (text: 'website', 'social_media')
      - `budget` (decimal)
      - `duration_days` (integer)
      - `location` (text)
      - `image` (text, url)
      - `link` (text)
      - `status` (text: 'pending', 'approved', 'active', 'expired', 'rejected')
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `created_at` (timestamptz)

    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `message` (text)
      - `type` (text)
      - `related_id` (uuid)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

    - `reviews`
      - `id` (uuid, primary key)
      - `buyer_id` (uuid, foreign key to users)
      - `seller_id` (uuid, foreign key to sellers)
      - `product_id` (uuid, foreign key to products)
      - `order_id` (uuid, foreign key to orders)
      - `rating` (integer)
      - `comment` (text)
      - `created_at` (timestamptz)

    - `admin_employees`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `permissions` (jsonb)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for buyers, sellers, and admins
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  phone text,
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  commercial_registration text,
  bank_account_details jsonb,
  logo text,
  contact_number text NOT NULL,
  contact_email text NOT NULL,
  city text NOT NULL,
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own profile"
  ON sellers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Sellers can update own profile"
  ON sellers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sellers can insert own profile"
  ON sellers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all sellers"
  ON sellers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all sellers"
  ON sellers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Buyers can view approved sellers"
  ON sellers FOR SELECT
  TO authenticated
  USING (approval_status = 'approved');

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  price decimal NOT NULL,
  material text,
  type text NOT NULL CHECK (type IN ('ready-made', 'customized')),
  images jsonb DEFAULT '[]'::jsonb,
  size jsonb,
  delivery_option text DEFAULT 'paid' CHECK (delivery_option IN ('free', 'paid')),
  delivery_price decimal DEFAULT 0,
  city text NOT NULL,
  stock_quantity integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view products"
  ON products FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Sellers can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_id AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_id AND sellers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_id AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_id AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  total_amount decimal NOT NULL,
  order_status text DEFAULT 'pending' CHECK (order_status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'held', 'released', 'refunded')),
  contract_file text,
  delivery_address jsonb,
  scheduled_visit timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Sellers can view their orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_id AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update their orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_id AND sellers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_id AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  amount decimal NOT NULL,
  commission decimal NOT NULL,
  vat decimal NOT NULL,
  net_amount decimal NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released', 'refunded')),
  stripe_payment_id text,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  released_at timestamptz
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id AND orders.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can view their payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN sellers s ON s.id = o.seller_id
      WHERE o.id = order_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  ad_type text NOT NULL CHECK (ad_type IN ('website', 'social_media')),
  budget decimal NOT NULL,
  duration_days integer NOT NULL,
  location text,
  image text,
  link text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'expired', 'rejected')),
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own ads"
  ON advertisements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_id AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can create ads"
  ON advertisements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_id AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all ads"
  ON advertisements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view active ads"
  ON advertisements FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Public can view active ads"
  ON advertisements FOR SELECT
  TO anon
  USING (status = 'active');

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view reviews"
  ON reviews FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Buyers can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Admin employees table
CREATE TABLE IF NOT EXISTS admin_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage employees"
  ON admin_employees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
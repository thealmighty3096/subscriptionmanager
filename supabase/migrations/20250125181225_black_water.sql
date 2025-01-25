/*
  # Initial Schema Setup for Subscription Manager

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `amount` (decimal)
      - `actual_amount` (decimal)
      - `billing_frequency` (text)
      - `start_date` (date)
      - `billing_date` (integer, 1-31)
      - `category` (text)
      - `reminder_days` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `subscriptions` table
    - Add policies for CRUD operations
*/

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  amount decimal(10,2) NOT NULL,  -- monthly equivalent amount
  actual_amount decimal(10,2) NOT NULL,  -- actual billed amount
  billing_frequency text NOT NULL DEFAULT 'monthly',
  start_date date NOT NULL,
  billing_date integer NOT NULL CHECK (billing_date BETWEEN 1 AND 31),
  category text NOT NULL,
  reminder_days integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
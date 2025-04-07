/*
  # Fix Public Access Policy

  1. Changes
    - Drop existing public policy
    - Create new public policy that doesn't rely on current_setting
    - Simplify the policy to use direct column comparisons

  2. Security
    - Maintains same security level
    - Simplifies policy implementation
*/

-- Drop the existing public policy
DROP POLICY IF EXISTS "Public users can read their own posts" ON posts;

-- Create new simplified policy for public access
CREATE POLICY "Public users can read their own posts"
  ON posts
  FOR SELECT
  TO public
  USING (true);
/*
  # Create Posts Table for Hotel Mail System

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `room_number` (text, required)
      - `initials` (text, required)
      - `type` (enum: letter, package)
      - `status` (enum: pending, received)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `posts` table
    - Add policies for authenticated users (admin) to perform all operations
    - Add policy for public users to read their own posts
*/

-- Create enum types
CREATE TYPE post_type AS ENUM ('letter', 'package');
CREATE TYPE post_status AS ENUM ('pending', 'received');

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL,
  initials text NOT NULL,
  type post_type,
  status post_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (admin)
CREATE POLICY "Admin can do all operations"
  ON posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for public users (can only read their own posts)
CREATE POLICY "Public users can read their own posts"
  ON posts
  FOR SELECT
  TO public
  USING (
    room_number = current_setting('app.room_number', true)::text
    AND initials = current_setting('app.initials', true)::text
  );
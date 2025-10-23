/*
  # Rap Battle Voting System Schema

  1. New Tables
    - `rounds`
      - `id` (uuid, primary key) - Unique identifier for each round/manche
      - `name` (text) - Name of the round (e.g., "Manche 1", "Manche 2")
      - `is_active` (boolean) - Whether this round is currently active for voting
      - `created_at` (timestamptz) - When the round was created
      
    - `votes`
      - `id` (uuid, primary key) - Unique identifier for each vote
      - `round_id` (uuid, foreign key) - Which round this vote belongs to
      - `verse_number` (integer) - Which verse was voted for (1, 2, or 3)
      - `voter_fingerprint` (text) - Unique identifier for the voter (combination of IP + browser fingerprint)
      - `created_at` (timestamptz) - When the vote was cast

  2. Security
    - Enable RLS on both tables
    - Public can insert votes (but only once per round)
    - Public can read active rounds
    - Only authenticated users (admin) can manage rounds and see all votes
    
  3. Important Notes
    - Each voter can only vote once per round
    - Votes are tracked by a fingerprint (combination of factors to identify unique users)
    - Admin dashboard requires authentication to view results
*/

-- Create rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  verse_number integer NOT NULL CHECK (verse_number IN (1, 2, 3)),
  voter_fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(round_id, voter_fingerprint)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_votes_round_id ON votes(round_id);
CREATE INDEX IF NOT EXISTS idx_votes_fingerprint ON votes(voter_fingerprint);
CREATE INDEX IF NOT EXISTS idx_rounds_active ON rounds(is_active);

-- Enable RLS
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Rounds policies
CREATE POLICY "Anyone can view active rounds"
  ON rounds FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all rounds"
  ON rounds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rounds"
  ON rounds FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rounds"
  ON rounds FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rounds"
  ON rounds FOR DELETE
  TO authenticated
  USING (true);

-- Votes policies
CREATE POLICY "Anyone can insert votes"
  ON votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rounds
      WHERE rounds.id = votes.round_id
      AND rounds.is_active = true
    )
  );

CREATE POLICY "Authenticated users can view all votes"
  ON votes FOR SELECT
  TO authenticated
  USING (true);
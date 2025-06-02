-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create increment and decrement functions
CREATE OR REPLACE FUNCTION increment(x integer) RETURNS integer AS $$
  BEGIN
    RETURN x + 1;
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement(x integer) RETURNS integer AS $$
  BEGIN
    RETURN GREATEST(0, x - 1);
  END;
$$ LANGUAGE plpgsql;

-- Likes policies
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone" 
  ON likes FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" 
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
  ON likes FOR DELETE USING (auth.uid() = user_id);

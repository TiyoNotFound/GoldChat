import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Log for debugging (will only show in server console, not client)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Check that you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  )
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type Profile = {
  id: string
  username: string
  avatar_url: string
  bio: string
  created_at: string
}

export type Post = {
  id: string
  user_id: string
  content: string
  image_url?: string
  created_at: string
  likes: number
  comments: number
  username: string
  avatar_url: string
}

export type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  username: string
  avatar_url: string
  created_at: string
}

export type LikeRecord = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

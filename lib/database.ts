import { supabase, type Profile, type Post } from "./supabase"

// User profile operations
export async function createProfile(profile: Omit<Profile, "id" | "created_at">) {
  const { data: user, error: authError } = await supabase.auth.getUser()

  if (authError || !user.user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.user.id,
    username: profile.username,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
  })

  if (error) throw error

  return user.user.id
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) throw error

  return data as Profile
}

export async function updateProfile(profile: Partial<Profile>) {
  const { data: user, error: authError } = await supabase.auth.getUser()

  if (authError || !user.user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("profiles").update(profile).eq("id", user.user.id)

  if (error) throw error
}

// Post operations
export async function createPost(post: Omit<Post, "id" | "created_at" | "user_id" | "username" | "avatar_url">) {
  const { data: user, error: authError } = await supabase.auth.getUser()

  if (authError || !user.user) {
    throw new Error("User not authenticated")
  }

  // Get the user's profile to include username and avatar
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.user.id)
    .single()

  if (profileError) throw profileError

  const { error } = await supabase.from("posts").insert({
    user_id: user.user.id,
    content: post.content,
    image_url: post.image_url,
    likes: 0,
    comments: 0,
    username: profile.username,
    avatar_url: profile.avatar_url,
  })

  if (error) throw error
}

export async function getPosts() {
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false })

  if (error) throw error

  return data as Post[]
}

export async function likePost(postId: string) {
  const { error } = await supabase.rpc("increment_likes", { post_id: postId })

  if (error) throw error
}

// File upload
export async function uploadImage(file: File, path: string) {
  const { data, error } = await supabase.storage.from("images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) throw error

  // Get public URL
  const { data: publicUrl } = supabase.storage.from("images").getPublicUrl(data.path)

  return publicUrl.publicUrl
}

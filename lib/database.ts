import { supabase, type Profile, type Post, type Comment } from "./supabase"

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

  if (error) {
    if (error.code === "PGRST116") {
      // No profile found (not an error for our purposes)
      return null
    }
    throw error
  }

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

// Like operations
export async function likePost(postId: string) {
  const { data: user, error: authError } = await supabase.auth.getUser()

  if (authError || !user.user) {
    throw new Error("User not authenticated")
  }

  // Check if user already liked this post
  const { data: existingLike } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.user.id)
    .single()

  if (existingLike) {
    // User already liked this post, so unlike it
    await supabase.from("likes").delete().eq("id", existingLike.id)

    // Decrement post likes count
    await supabase
      .from("posts")
      .update({ likes: supabase.rpc("decrement", { x: 1 }) })
      .eq("id", postId)

    return { liked: false }
  } else {
    // User hasn't liked this post, so like it
    await supabase.from("likes").insert({
      post_id: postId,
      user_id: user.user.id,
    })

    // Increment post likes count
    await supabase
      .from("posts")
      .update({ likes: supabase.rpc("increment", { x: 1 }) })
      .eq("id", postId)

    return { liked: true }
  }
}

export async function checkIfLiked(postId: string) {
  const { data: user, error: authError } = await supabase.auth.getUser()

  if (authError || !user.user) {
    return false
  }

  const { data } = await supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", user.user.id).single()

  return !!data
}

export async function getLikedPosts() {
  const { data: user, error: authError } = await supabase.auth.getUser()

  if (authError || !user.user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase.from("likes").select("post_id").eq("user_id", user.user.id)

  if (error) throw error

  return (data || []).map((like) => like.post_id)
}

// Comment operations
export async function createComment(postId: string, content: string) {
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

  // Insert the comment
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.user.id,
    content,
    username: profile.username,
    avatar_url: profile.avatar_url,
  })

  if (error) throw error

  // Increment the comments count on the post
  await supabase
    .from("posts")
    .update({ comments: supabase.rpc("increment", { x: 1 }) })
    .eq("id", postId)
}

export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  if (error) throw error

  return data as Comment[]
}

export async function deleteComment(commentId: string, postId: string) {
  const { data: user, error: authError } = await supabase.auth.getUser()

  if (authError || !user.user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.user.id)

  if (error) throw error

  // Decrement the comments count on the post
  await supabase
    .from("posts")
    .update({ comments: supabase.rpc("decrement", { x: 1 }) })
    .eq("id", postId)
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

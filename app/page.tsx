"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, MessageCircle, Upload, LogOut, Settings, ChevronDown, ChevronUp } from "lucide-react"
import { getPosts, createPost, likePost, uploadImage, getLikedPosts } from "@/lib/database"
import { CommentSection } from "@/components/comment-section"
import { ShareDialog } from "@/components/share-dialog"
import type { Post } from "@/lib/supabase"

export default function MonoForum() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [likedPosts, setLikedPosts] = useState<string[]>([])
  const [expandedComments, setExpandedComments] = useState<string[]>([])
  const { user, profile, isLoading, profileLoading, signOut } = useAuth()
  const router = useRouter()

  // Redirect to auth if not logged in (only after auth is checked)
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  // Redirect to profile setup if logged in but no profile (only after profile check is complete)
  useEffect(() => {
    if (!isLoading && user && !profileLoading && !profile) {
      router.push("/profile/setup")
    }
  }, [user, profile, isLoading, profileLoading, router])

  // Fetch posts and liked posts
  useEffect(() => {
    async function loadData() {
      try {
        const [postsData, likedPostsData] = await Promise.all([getPosts(), user ? getLikedPosts() : []])

        setPosts(postsData)
        setLikedPosts(likedPostsData)
      } catch (err: any) {
        console.error("Error loading data:", err)
        setError("Failed to load posts")
      }
    }

    if (user && profile) {
      loadData()
    }
  }, [user, profile])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedFile) return
    if (!user || !profile) return

    setLoading(true)
    setError(null)

    try {
      let imageUrl: string | undefined = undefined

      if (selectedFile) {
        const path = `posts/${user.id}/${Date.now()}-${selectedFile.name}`
        imageUrl = await uploadImage(selectedFile, path)
      }

      await createPost({
        content: newPost,
        image_url: imageUrl,
        likes: 0,
        comments: 0,
      })

      // Refresh posts
      const updatedPosts = await getPosts()
      setPosts(updatedPosts)

      // Reset form
      setNewPost("")
      setSelectedFile(null)
      setSelectedImage(null)
    } catch (err: any) {
      console.error("Error creating post:", err)
      setError("Failed to create post")
    } finally {
      setLoading(false)
    }
  }

  const handleLikePost = async (postId: string) => {
    if (!user) return

    try {
      const { liked } = await likePost(postId)

      // Update local state
      if (liked) {
        setLikedPosts([...likedPosts, postId])
        setPosts(posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
      } else {
        setLikedPosts(likedPosts.filter((id) => id !== postId))
        setPosts(posts.map((post) => (post.id === postId ? { ...post, likes: Math.max(0, post.likes - 1) } : post)))
      }
    } catch (err) {
      console.error("Error liking post:", err)
    }
  }

  const toggleComments = (postId: string) => {
    if (expandedComments.includes(postId)) {
      setExpandedComments(expandedComments.filter((id) => id !== postId))
    } else {
      setExpandedComments([...expandedComments, postId])
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  // Show loading state
  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // If not logged in or no profile, the redirect will happen in useEffect
  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Mono Forum</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">{profile.username}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/profile/edit")}>
              <Settings className="h-4 w-4" />
              <span className="sr-only">Edit Profile</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Create Post */}
        <Card className="mb-6 border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[80px] border-gray-200 focus:border-gray-400 resize-none"
                  disabled={loading}
                />

                {selectedImage && (
                  <div className="relative">
                    <img
                      src={selectedImage || "/placeholder.svg"}
                      alt="Upload preview"
                      className="rounded-lg max-h-64 w-full object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedImage(null)
                        setSelectedFile(null)
                      }}
                      disabled={loading}
                    >
                      Remove
                    </Button>
                  </div>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={loading}
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button variant="ghost" size="sm" asChild disabled={loading}>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Photo
                        </span>
                      </Button>
                    </Label>
                  </div>
                  <Button
                    onClick={handleCreatePost}
                    disabled={(!newPost.trim() && !selectedFile) || loading}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {loading ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-8 text-center text-gray-500">
                <p>No posts yet. Be the first to share something!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{post.username}</span>
                        <span className="text-sm text-gray-500">·</span>
                        <span className="text-sm text-gray-500">{formatTimeAgo(post.created_at)}</span>
                      </div>

                      {post.content && <p className="text-gray-800 mb-3 leading-relaxed">{post.content}</p>}

                      {post.image_url && (
                        <img
                          src={post.image_url || "/placeholder.svg"}
                          alt="Post image"
                          className="rounded-lg w-full max-h-96 object-cover mb-3"
                        />
                      )}

                      <div className="flex items-center gap-6 text-gray-500">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`p-0 h-auto ${likedPosts.includes(post.id) ? "text-red-500" : "hover:text-red-500"}`}
                          onClick={() => handleLikePost(post.id)}
                        >
                          <Heart
                            className="h-4 w-4 mr-1"
                            fill={likedPosts.includes(post.id) ? "currentColor" : "none"}
                          />
                          {post.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto hover:text-blue-500"
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.comments}
                          {expandedComments.includes(post.id) ? (
                            <ChevronUp className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                        <ShareDialog postId={post.id} content={post.content} />
                      </div>

                      {/* Comments Section */}
                      {expandedComments.includes(post.id) && (
                        <div className="mt-4">
                          <CommentSection
                            postId={post.id}
                            onCommentCountChange={(count) => {
                              setPosts(posts.map((p) => (p.id === post.id ? { ...p, comments: count } : p)))
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

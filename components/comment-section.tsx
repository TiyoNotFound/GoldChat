"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { createComment, getComments, deleteComment } from "@/lib/database"
import type { Comment } from "@/lib/supabase"
import { Trash2 } from "lucide-react"

interface CommentSectionProps {
  postId: string
  onCommentCountChange?: (count: number) => void
}

export function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, profile } = useAuth()

  useEffect(() => {
    async function loadComments() {
      try {
        const data = await getComments(postId)
        setComments(data)
        if (onCommentCountChange) {
          onCommentCountChange(data.length)
        }
      } catch (err: any) {
        console.error("Error loading comments:", err)
        setError("Failed to load comments")
      }
    }

    loadComments()
  }, [postId, onCommentCountChange])

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !profile) return

    setLoading(true)
    setError(null)

    try {
      await createComment(postId, newComment)

      // Refresh comments
      const updatedComments = await getComments(postId)
      setComments(updatedComments)

      // Reset form
      setNewComment("")

      if (onCommentCountChange) {
        onCommentCountChange(updatedComments.length)
      }
    } catch (err: any) {
      console.error("Error creating comment:", err)
      setError("Failed to post comment")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId, postId)

      // Update local state
      const updatedComments = comments.filter((comment) => comment.id !== commentId)
      setComments(updatedComments)

      if (onCommentCountChange) {
        onCommentCountChange(updatedComments.length)
      }
    } catch (err: any) {
      console.error("Error deleting comment:", err)
      setError("Failed to delete comment")
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

  return (
    <div className="space-y-4">
      <Separator />

      {/* Comment input */}
      {user && profile && (
        <div className="flex gap-3 items-start">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] resize-none"
              disabled={loading}
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmitComment} disabled={!newComment.trim() || loading} size="sm">
                {loading ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-2">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{comment.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.username}</span>
                    <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  {user && user.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

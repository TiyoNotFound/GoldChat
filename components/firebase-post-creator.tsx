"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, User } from "lucide-react"
import { createPost, uploadImage } from "@/lib/firebase-operations"

interface UserProfile {
  username: string
  profilePic: string
  bio: string
}

interface FirebasePostCreatorProps {
  currentUser: UserProfile | null
  onPostCreated: () => void
}

export default function FirebasePostCreator({ currentUser, onPostCreated }: FirebasePostCreatorProps) {
  const [newPost, setNewPost] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
    if (!currentUser) return

    setIsLoading(true)
    try {
      let imageUrl = undefined

      // Upload image if selected
      if (selectedFile) {
        const imagePath = `posts/${Date.now()}_${selectedFile.name}`
        imageUrl = await uploadImage(selectedFile, imagePath)
      }

      // Create post in Firestore
      await createPost({
        username: currentUser.username,
        profilePic: currentUser.profilePic,
        content: newPost,
        imageUrl,
        likes: 0,
        comments: 0,
      })

      // Reset form
      setNewPost("")
      setSelectedFile(null)
      setSelectedImage(null)
      onPostCreated()
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6 border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser?.profilePic || "/placeholder.svg"} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[80px] border-gray-200 focus:border-gray-400 resize-none"
              disabled={isLoading}
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
                  disabled={isLoading}
                >
                  Remove
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isLoading}
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button variant="ghost" size="sm" asChild disabled={isLoading}>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Photo
                    </span>
                  </Button>
                </Label>
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={(!newPost.trim() && !selectedFile) || isLoading}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {isLoading ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

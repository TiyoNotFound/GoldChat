"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createProfile, uploadImage, getProfile } from "@/lib/database"

export default function ProfileSetupPage() {
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const { user, profile, setProfile, isLoading } = useAuth()
  const router = useRouter()

  // Check if user already has a profile
  useEffect(() => {
    async function checkExistingProfile() {
      if (!user) return

      try {
        setCheckingProfile(true)
        const existingProfile = await getProfile(user.id)
        if (existingProfile) {
          // User already has a profile, redirect to home
          setProfile(existingProfile)
          router.push("/")
        }
      } catch (err) {
        // No profile exists, continue with setup
        console.log("No existing profile found, continuing with setup")
      } finally {
        setCheckingProfile(false)
      }
    }

    if (user && !profile) {
      checkExistingProfile()
    } else if (profile) {
      // If profile already exists in context, redirect to home
      router.push("/")
    } else {
      setCheckingProfile(false)
    }
  }, [user, profile, router, setProfile])

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) throw new Error("User not authenticated")

      let avatarUrl = ""

      if (avatarFile) {
        const path = `avatars/${user.id}/${Date.now()}-${avatarFile.name}`
        avatarUrl = await uploadImage(avatarFile, path)
      }

      await createProfile({
        username,
        bio,
        avatar_url: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
      })

      // Update local profile state
      setProfile({
        id: user.id,
        username,
        bio,
        avatar_url: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
        created_at: new Date().toISOString(),
      })

      router.push("/")
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // If not logged in, the redirect will happen in useEffect
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || ""} />
                  <AvatarFallback>{username ? username[0].toUpperCase() : "U"}</AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-gray-900 text-white rounded-full p-1 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="sr-only">Upload avatar</span>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Profile..." : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

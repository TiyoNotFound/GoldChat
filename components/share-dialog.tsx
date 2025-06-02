"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share, Copy, Check, Twitter, Facebook, Linkedin, Link } from "lucide-react"

interface ShareDialogProps {
  postId: string
  content: string
}

export function ShareDialog({ postId, content }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  // Create share URL - in a real app, this would be your actual domain
  const shareUrl = `${window.location.origin}/post/${postId}`

  // Truncate content for social sharing
  const truncatedContent = content.length > 60 ? `${content.substring(0, 60)}...` : content

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSocialShare = (platform: string) => {
    let url = ""

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(truncatedContent)}&url=${encodeURIComponent(shareUrl)}`
        break
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      default:
        return
    }

    window.open(url, "_blank", "width=600,height=400")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0 h-auto hover:text-green-500">
          <Share className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input readOnly value={shareUrl} className="h-9" />
            </div>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy</span>
            </Button>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-[#1DA1F2] text-white hover:bg-[#1a91da]"
              onClick={() => handleSocialShare("twitter")}
            >
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Share on Twitter</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-[#1877F2] text-white hover:bg-[#166fe5]"
              onClick={() => handleSocialShare("facebook")}
            >
              <Facebook className="h-4 w-4" />
              <span className="sr-only">Share on Facebook</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-[#0A66C2] text-white hover:bg-[#0958a8]"
              onClick={() => handleSocialShare("linkedin")}
            >
              <Linkedin className="h-4 w-4" />
              <span className="sr-only">Share on LinkedIn</span>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full" onClick={handleCopy}>
              <Link className="h-4 w-4" />
              <span className="sr-only">Copy link</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase/client"
import { uploadProfilePicture } from "@/app/actions/upload-profile-picture"
import {
  Edit,
  Mail,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  UserPlus,
  CheckCircle,
  XCircle,
  Store,
  BookOpen,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const BOOK_CATEGORIES = [
  "文學小說",
  "商業理財",
  "科學科技",
  "歷史傳記",
  "藝術設計",
  "旅遊地圖",
  "健康生活",
  "心理勵志",
  "宗教哲學",
  "社會科學",
  "自然科普",
  "語言學習",
  "電腦資訊",
  "娛樂影視",
  "運動休閒",
  "漫畫繪本",
  "兒童讀物",
  "青少年讀物",
]

interface Profile {
  id: string
  username: string | null
  display_name: string | null
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  language: string | null
  interested_categories: string[] | null
  contact_email: string | null
  facebook_url: string | null
  instagram_url: string | null
  created_at: string
  updated_at: string
}

interface ConnectionInvitation {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  message: string | null
  created_at: string
}

interface ProfileContentProps {
  profile: Profile | null
  userId: string
  isOwnProfile: boolean
  existingInvitation?: ConnectionInvitation | null
  hasBookstore?: boolean
  onViewBookstore?: () => void
  onViewBookshelf?: () => void
}

export function ProfileContent({
  profile,
  userId,
  isOwnProfile,
  existingInvitation,
  hasBookstore,
  onViewBookstore,
  onViewBookshelf,
}: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSendingInvitation, setIsSendingInvitation] = useState(false)
  const [invitationMessage, setInvitationMessage] = useState("")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    language: profile?.language || "",
    interested_categories: profile?.interested_categories || [],
    contact_email: profile?.contact_email || "",
    facebook_url: profile?.facebook_url || "",
    instagram_url: profile?.instagram_url || "",
  })

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createBrowserClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: formData.display_name,
        full_name: formData.full_name,
        bio: formData.bio,
        location: formData.location,
        language: formData.language,
        interested_categories: formData.interested_categories,
        contact_email: formData.contact_email,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    setIsSaving(false)

    if (error) {
      toast({
        title: "錯誤",
        description: "保存個人資料失敗",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "成功",
      description: "個人資料已保存",
    })
    setIsEditing(false)
    window.location.reload()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const result = await uploadProfilePicture(formData)
    setIsUploading(false)

    if (result.error) {
      toast({
        title: "錯誤",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "成功",
      description: "頭像已更新",
    })
    window.location.reload()
  }

  const toggleCategory = (category: string) => {
    setFormData((prev) => {
      const categories = prev.interested_categories || []
      if (categories.includes(category)) {
        return { ...prev, interested_categories: categories.filter((c) => c !== category) }
      } else {
        return { ...prev, interested_categories: [...categories, category] }
      }
    })
  }

  const handleSendInvitation = async () => {
    setIsSendingInvitation(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("connection_invitations").insert({
      sender_id: userId,
      receiver_id: profile?.id,
      status: "pending",
      message: invitationMessage,
    })

    setIsSendingInvitation(false)

    if (error) {
      toast({
        title: "錯誤",
        description: "發送連結邀請失敗",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "成功",
      description: "連結邀請已發送",
    })
    window.location.reload()
  }

  const handleResponseInvitation = async (status: "accepted" | "rejected") => {
    const supabase = createBrowserClient()

    const { error } = await supabase
      .from("connection_invitations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", existingInvitation?.id)

    if (error) {
      toast({
        title: "錯誤",
        description: "更新連結邀請失敗",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "成功",
      description: status === "accepted" ? "已接受連結邀請" : "已拒絕連結邀請",
    })
    window.location.reload()
  }

  const displayName = profile?.display_name || profile?.full_name || profile?.username || "匿名用戶"

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-6 space-y-2">
        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-border">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                    <Edit className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold">{displayName}</h1>
                  {profile?.username && <p className="text-muted-foreground">@{profile.username}</p>}
                </div>

                {profile?.bio && <p className="text-foreground/80">{profile.bio}</p>}

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {profile?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile?.language && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <span>{profile.language}</span>
                    </div>
                  )}
                  {profile?.contact_email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{profile.contact_email}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {profile?.facebook_url && (
                    <a
                      href={profile.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {profile?.instagram_url && (
                    <a
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-700"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {isOwnProfile ? (
                    <Button onClick={() => setIsEditing(true)} variant="default">
                      <Edit className="h-4 w-4 mr-2" />
                      編輯個人資料
                    </Button>
                  ) : (
                    <>
                      {hasBookstore && onViewBookstore && (
                        <Button onClick={onViewBookstore} variant="outline">
                          <Store className="h-4 w-4 mr-2" />
                          參觀書店
                        </Button>
                      )}
                      {onViewBookshelf && (
                        <Button onClick={onViewBookshelf} variant="outline">
                          <BookOpen className="h-4 w-4 mr-2" />
                          查看書架
                        </Button>
                      )}

                      {!existingInvitation && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="default">
                              <UserPlus className="h-4 w-4 mr-2" />
                              發送連結邀請
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>發送連結邀請給 {displayName}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="message">邀請訊息（選填）</Label>
                                <Textarea
                                  id="message"
                                  placeholder="向對方介紹自己..."
                                  value={invitationMessage}
                                  onChange={(e) => setInvitationMessage(e.target.value)}
                                  rows={4}
                                />
                              </div>
                              <Button onClick={handleSendInvitation} disabled={isSendingInvitation} className="w-full">
                                {isSendingInvitation ? "發送中..." : "發送邀請"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {existingInvitation?.status === "pending" && existingInvitation.receiver_id === userId && (
                        <div className="flex gap-2">
                          <Button onClick={() => handleResponseInvitation("accepted")} variant="default">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            接受邀請
                          </Button>
                          <Button onClick={() => handleResponseInvitation("rejected")} variant="outline">
                            <XCircle className="h-4 w-4 mr-2" />
                            拒絕邀請
                          </Button>
                        </div>
                      )}
                      {existingInvitation?.status === "pending" && existingInvitation.sender_id === userId && (
                        <Badge variant="secondary">邀請已發送</Badge>
                      )}
                      {existingInvitation?.status === "accepted" && <Badge variant="default">已連結</Badge>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interested Categories */}
        {profile?.interested_categories && profile.interested_categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>感興趣的書籍類別</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.interested_categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>編輯個人資料</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="display_name">顯示名稱</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="您希望其他人看到的名稱"
                />
              </div>

              <div>
                <Label htmlFor="full_name">全名</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="bio">個人簡介</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="介紹一下自己..."
                />
              </div>

              <div>
                <Label htmlFor="location">所在地</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="例如：台北市"
                />
              </div>

              <div>
                <Label htmlFor="language">語言</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  placeholder="例如：繁體中文"
                />
              </div>

              <div>
                <Label htmlFor="contact_email">聯絡電子郵件</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="facebook_url">Facebook 個人檔案連結</Label>
                <Input
                  id="facebook_url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/yourprofile"
                />
              </div>

              <div>
                <Label htmlFor="instagram_url">Instagram 個人檔案連結</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>

              <div>
                <Label>感興趣的書籍類別</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {BOOK_CATEGORIES.map((category) => (
                    <Badge
                      key={category}
                      variant={formData.interested_categories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? "保存中..." : "保存"}
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                  取消
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

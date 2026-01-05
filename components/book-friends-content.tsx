"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@/lib/supabase/client"
import { UserMinus, Search, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  username: string | null
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
}

interface FollowRequest {
  id: string
  follower_id: string
  following_id: string
  message: string | null
  status: string
  created_at: string
}

interface BookFriendsContentProps {
  userId: string
  followingIds: string[]
  followerIds: string[]
  mutualIds: string[]
  profiles: Profile[]
  pendingRequests: FollowRequest[]
  sentRequests: FollowRequest[]
  pendingProfiles: Profile[]
}

export function BookFriendsContent({
  userId,
  followingIds,
  followerIds,
  mutualIds,
  profiles,
  pendingRequests,
  sentRequests,
  pendingProfiles,
}: BookFriendsContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const supabase = createBrowserClient()

  const ADMIN_USER_ID = "7881efa4-4809-47da-b719-2139bd41d603"

  const getDisplayName = (profile: Profile) => {
    return profile.display_name || profile.full_name || profile.username || "匿名用戶"
  }

  const handleUnfollow = async (followingId: string) => {
    const { error } = await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", followingId)

    if (error) {
      toast({
        title: "錯誤",
        description: "取消追蹤失敗",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "成功",
      description: "已取消追蹤",
    })
    router.refresh()
  }

  const handleAcceptFollow = async (followId: string) => {
    const { error } = await supabase
      .from("follows")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", followId)

    if (error) {
      toast({
        title: "錯誤",
        description: "接受追蹤失敗",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "成功",
      description: "已接受追蹤請求",
    })
    router.refresh()
  }

  const handleRejectFollow = async (followId: string) => {
    const { error } = await supabase.from("follows").delete().eq("id", followId)

    if (error) {
      toast({
        title: "錯誤",
        description: "拒絕追蹤失敗",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "成功",
      description: "已拒絕追蹤請求",
    })
    router.refresh()
  }

  const filterProfiles = (ids: string[]) => {
    return profiles
      .filter((p) => ids.includes(p.id))
      .filter((p) => p.id !== ADMIN_USER_ID)
      .filter(
        (p) =>
          searchQuery === "" ||
          getDisplayName(p).toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.username?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
  }

  const followingProfiles = filterProfiles(followingIds)
  const followerProfiles = filterProfiles(followerIds)
  const mutualProfiles = filterProfiles(mutualIds)

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">書友列表</h1>
          <p className="text-muted-foreground mt-2">管理您的書友關係</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋書友..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>待處理的追蹤請求</CardTitle>
              <CardDescription>{pendingRequests.length} 個新請求</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingRequests.map((request) => {
                const profile = pendingProfiles.find((p) => p.id === request.follower_id)
                if (!profile) return null

                return (
                  <div key={request.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar
                      className="h-12 w-12 cursor-pointer"
                      onClick={() => router.push(`/app/profile/${profile.id}`)}
                    >
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>{getDisplayName(profile).charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => router.push(`/app/profile/${profile.id}`)}
                      >
                        {getDisplayName(profile)}
                      </p>
                      {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                      {request.message && <p className="text-sm text-muted-foreground mt-1">{request.message}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAcceptFollow(request.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        接受
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectFollow(request.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        拒絕
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>已發送的追蹤請求</CardTitle>
              <CardDescription>{sentRequests.length} 個待回應</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sentRequests.map((request) => {
                const profile = pendingProfiles.find((p) => p.id === request.following_id)
                if (!profile) return null

                return (
                  <div key={request.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar
                      className="h-12 w-12 cursor-pointer"
                      onClick={() => router.push(`/app/profile/${profile.id}`)}
                    >
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>{getDisplayName(profile).charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => router.push(`/app/profile/${profile.id}`)}
                      >
                        {getDisplayName(profile)}
                      </p>
                      {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      待回應
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Tabs for different lists */}
        <Tabs defaultValue="mutual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mutual">書友 ({mutualProfiles.length})</TabsTrigger>
            <TabsTrigger value="following">追蹤中 ({followingProfiles.length})</TabsTrigger>
            <TabsTrigger value="followers">追蹤者 ({followerProfiles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="mutual" className="space-y-4">
            {mutualProfiles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">尚無互相追蹤的書友</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {mutualProfiles.map((profile) => (
                  <Card key={profile.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar
                        className="h-16 w-16 cursor-pointer"
                        onClick={() => router.push(`/app/profile/${profile.id}`)}
                      >
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{getDisplayName(profile).charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p
                          className="font-medium text-lg cursor-pointer hover:underline"
                          onClick={() => router.push(`/app/profile/${profile.id}`)}
                        >
                          {getDisplayName(profile)}
                        </p>
                        {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleUnfollow(profile.id)}>
                        <UserMinus className="h-4 w-4 mr-2" />
                        取消追蹤
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            {followingProfiles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">尚未追蹤任何書友</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {followingProfiles.map((profile) => (
                  <Card key={profile.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar
                        className="h-16 w-16 cursor-pointer"
                        onClick={() => router.push(`/app/profile/${profile.id}`)}
                      >
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{getDisplayName(profile).charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p
                          className="font-medium text-lg cursor-pointer hover:underline"
                          onClick={() => router.push(`/app/profile/${profile.id}`)}
                        >
                          {getDisplayName(profile)}
                        </p>
                        {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleUnfollow(profile.id)}>
                        <UserMinus className="h-4 w-4 mr-2" />
                        取消追蹤
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="space-y-4">
            {followerProfiles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">尚無追蹤者</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {followerProfiles.map((profile) => (
                  <Card key={profile.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar
                        className="h-16 w-16 cursor-pointer"
                        onClick={() => router.push(`/app/profile/${profile.id}`)}
                      >
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{getDisplayName(profile).charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p
                          className="font-medium text-lg cursor-pointer hover:underline"
                          onClick={() => router.push(`/app/profile/${profile.id}`)}
                        >
                          {getDisplayName(profile)}
                        </p>
                        {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { DialogDescription } from "@/components/ui/dialog"

import { DialogTitle } from "@/components/ui/dialog"

import { DialogHeader } from "@/components/ui/dialog"

import { DialogContent } from "@/components/ui/dialog"

import { Dialog } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { MessageCircle, Send, Inbox, BoomBox as Outbox, Search, X } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  subject: string
  content: string
  book_id: string | null
  message_type: string
  is_read: boolean
  is_archived: boolean
  created_at: string
  read_at: string | null
  sender?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  receiver?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  book?: {
    title: string
    author: string
    image_url: string | null
  }
}

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export function MessagesContent({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<"inbox" | "outbox">("inbox")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  // Compose form state
  const [composeData, setComposeData] = useState({
    receiverSearch: "",
    subject: "",
    content: "",
    receiverId: "",
  })
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedReceiver, setSelectedReceiver] = useState<Profile | null>(null)

  useEffect(() => {
    fetchMessages()
  }, [activeTab])

  async function fetchMessages() {
    setLoading(true)
    const supabase = createClient()

    const messagesQuery = supabase
      .from("messages")
      .select("*")
      .eq(activeTab === "inbox" ? "receiver_id" : "sender_id", userId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })

    const { data: messagesData, error: messagesError } = await messagesQuery

    if (messagesError) {
      console.error("Error fetching messages:", messagesError)
      setLoading(false)
      return
    }

    if (!messagesData || messagesData.length === 0) {
      setMessages([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    // Get unique user IDs and book IDs from messages
    const senderIds = [...new Set(messagesData.map((m) => m.sender_id).filter(Boolean))]
    const receiverIds = [...new Set(messagesData.map((m) => m.receiver_id).filter(Boolean))]
    const bookIds = [...new Set(messagesData.map((m) => m.book_id).filter(Boolean))]

    // Fetch profiles for senders and receivers
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", [...senderIds, ...receiverIds])

    // Fetch books
    const { data: booksData } =
      bookIds.length > 0
        ? await supabase.from("books").select("id, title, author, image_url").in("id", bookIds)
        : { data: [] }

    // Create lookup maps
    const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || [])
    const booksMap = new Map(booksData?.map((b) => [b.id, b]) || [])

    // Combine data
    const combinedMessages = messagesData.map((message) => ({
      ...message,
      sender: message.sender_id ? profilesMap.get(message.sender_id) : undefined,
      receiver: message.receiver_id ? profilesMap.get(message.receiver_id) : undefined,
      book: message.book_id ? booksMap.get(message.book_id) : undefined,
    }))

    setMessages(combinedMessages)
    if (activeTab === "inbox") {
      setUnreadCount(combinedMessages.filter((m) => !m.is_read).length || 0)
    }
    setLoading(false)
  }

  async function markAsRead(messageId: string) {
    const supabase = createClient()
    await supabase.from("messages").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", messageId)
    fetchMessages()
  }

  async function handleSearchUsers(query: string) {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    const supabase = createClient()
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .neq("id", userId)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(5)

    setSearchResults(data || [])
  }

  async function handleSendMessage() {
    if (!selectedReceiver || !composeData.subject || !composeData.content) {
      alert("請填寫所有必填欄位")
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: selectedReceiver.id,
      subject: composeData.subject,
      content: composeData.content,
      message_type: "general",
    })

    if (error) {
      console.error("Error sending message:", error)
      alert("發送失敗")
    } else {
      alert("訊息已發送！")
      setShowCompose(false)
      setComposeData({ receiverSearch: "", subject: "", content: "", receiverId: "" })
      setSelectedReceiver(null)
      fetchMessages()
    }
  }

  const filteredMessages = messages.filter(
    (msg) =>
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activeTab === "inbox" && msg.sender?.username?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (activeTab === "outbox" && msg.receiver?.username?.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              訊息中心
            </h1>
            <p className="text-sm text-muted-foreground">管理您的收件箱和寄件箱</p>
          </div>
          <Button onClick={() => setShowCompose(true)} className="bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4 mr-2" />
            新訊息
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋訊息..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "inbox" | "outbox")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox" className="relative">
              <Inbox className="w-4 h-4 mr-2" />
              收件箱
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 rounded-full px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outbox">
              <Outbox className="w-4 h-4 mr-2" />
              寄件箱
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-2 mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">載入中...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>收件箱是空的</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <Card
                  key={message.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${!message.is_read ? "bg-blue-50 border-blue-200" : ""}`}
                  onClick={() => {
                    router.push(`/app/messages/${message.id}`)
                  }}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {message.sender?.avatar_url && (
                          <Image
                            src={message.sender.avatar_url || "/placeholder.svg"}
                            alt={message.sender.display_name || message.sender.username}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {message.sender?.display_name || message.sender?.username || "未知用戶"}
                            </p>
                            {!message.is_read && <Badge variant="default">新</Badge>}
                          </div>
                          <p className="text-sm font-medium text-foreground">{message.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{message.content}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {format(new Date(message.created_at), "MM/dd HH:mm", { locale: zhTW })}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="outbox" className="space-y-2 mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">載入中...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Outbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>寄件箱是空的</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <Card
                  key={message.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => {
                    router.push(`/app/messages/${message.id}`)
                  }}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {message.receiver?.avatar_url && (
                          <Image
                            src={message.receiver.avatar_url || "/placeholder.svg"}
                            alt={message.receiver.display_name || message.receiver.username}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">
                            收件人：{message.receiver?.display_name || message.receiver?.username || "未知用戶"}
                          </p>
                          <p className="text-sm font-medium text-foreground">{message.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{message.content}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {format(new Date(message.created_at), "MM/dd HH:mm", { locale: zhTW })}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新訊息</DialogTitle>
            <DialogDescription>撰寫並發送新訊息給其他用戶</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>收件人</Label>
              {selectedReceiver ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg mt-2">
                  <div className="flex items-center gap-3">
                    {selectedReceiver.avatar_url && (
                      <Image
                        src={selectedReceiver.avatar_url || "/placeholder.svg"}
                        alt={selectedReceiver.display_name || selectedReceiver.username}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <span>{selectedReceiver.display_name || selectedReceiver.username}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedReceiver(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="搜尋用戶名稱..."
                    value={composeData.receiverSearch}
                    onChange={(e) => {
                      setComposeData({ ...composeData, receiverSearch: e.target.value })
                      handleSearchUsers(e.target.value)
                    }}
                    className="mt-2"
                  />
                  {searchResults.length > 0 && (
                    <Card className="mt-2">
                      <CardContent className="p-2">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                            onClick={() => {
                              setSelectedReceiver(user)
                              setSearchResults([])
                              setComposeData({ ...composeData, receiverSearch: "" })
                            }}
                          >
                            {user.avatar_url && (
                              <Image
                                src={user.avatar_url || "/placeholder.svg"}
                                alt={user.display_name || user.username}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            )}
                            <span>{user.display_name || user.username}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
            <div>
              <Label>主旨</Label>
              <Input
                placeholder="輸入訊息主旨..."
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>訊息內容</Label>
              <Textarea
                placeholder="輸入訊息內容..."
                value={composeData.content}
                onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                rows={8}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompose(false)}>
              取消
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!selectedReceiver || !composeData.subject || !composeData.content}
            >
              <Send className="w-4 h-4 mr-2" />
              發送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Paperclip, X } from "lucide-react"
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
  created_at: string
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

export function MessageDetailContent({ userId, messageId }: { userId: string; messageId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReply, setShowReply] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchMessage()
  }, [messageId])

  async function fetchMessage() {
    setLoading(true)
    const supabase = createClient()

    // Fetch message
    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single()

    if (messageError || !messageData) {
      console.error("Error fetching message:", messageError)
      setLoading(false)
      return
    }

    // Verify user has access to this message
    if (messageData.sender_id !== userId && messageData.receiver_id !== userId) {
      router.push("/app/messages")
      return
    }

    // Fetch sender profile
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", messageData.sender_id)
      .single()

    // Fetch receiver profile
    const { data: receiverProfile } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", messageData.receiver_id)
      .single()

    // Fetch book if referenced
    let bookData = null
    if (messageData.book_id) {
      const { data } = await supabase
        .from("books")
        .select("id, title, author, image_url")
        .eq("id", messageData.book_id)
        .single()
      bookData = data
    }

    const fullMessage = {
      ...messageData,
      sender: senderProfile,
      receiver: receiverProfile,
      book: bookData,
    }

    setMessage(fullMessage)

    // Mark as read if user is receiver and message is unread
    if (messageData.receiver_id === userId && !messageData.is_read) {
      await supabase.from("messages").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", messageId)
    }

    if (messageData.receiver_id === userId) {
      const senderName = senderProfile?.display_name || senderProfile?.username || "對方"
      setReplyContent(
        `\n\n---\n回覆：${senderName} 的訊息\n原訊息：${messageData.content.substring(0, 100)}${messageData.content.length > 100 ? "..." : ""}`,
      )
    }

    setLoading(false)
  }

  async function handleSendReply() {
    if (!message || !replyContent.trim()) {
      alert("請填寫回覆內容")
      return
    }

    setSending(true)
    const supabase = createClient()

    // Determine receiver (reply to sender if current user is receiver, otherwise reply to receiver)
    const replyToId = message.receiver_id === userId ? message.sender_id : message.receiver_id

    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: replyToId,
      subject: `Re: ${message.subject}`,
      content: replyContent,
      message_type: "reply",
      book_id: message.book_id,
    })

    if (error) {
      console.error("Error sending reply:", error)
      alert("發送失敗")
      setSending(false)
    } else {
      alert("回覆已發送！")
      setShowReply(false)
      setReplyContent("")
      setAttachments([])
      setSending(false)
      router.push("/app/messages")
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments([...attachments, ...newFiles])
    }
  }

  function removeAttachment(index: number) {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-8 text-muted-foreground">載入中...</div>
        </div>
      </div>
    )
  }

  if (!message) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-8 text-muted-foreground">訊息不存在</div>
        </div>
      </div>
    )
  }

  const isInbox = message.receiver_id === userId
  const otherUser = isInbox ? message.sender : message.receiver

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{message.subject}</h1>
            <p className="text-sm text-muted-foreground">
              {isInbox ? "寄件人" : "收件人"}：{otherUser?.display_name || otherUser?.username || "未知用戶"}
              {" • "}
              {format(new Date(message.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhTW })}
            </p>
          </div>
        </div>

        {/* Message Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {otherUser?.avatar_url && (
                <Image
                  src={otherUser.avatar_url || "/placeholder.svg"}
                  alt={otherUser.display_name || otherUser.username || "User"}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-semibold">{otherUser?.display_name || otherUser?.username || "未知用戶"}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(message.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhTW })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {message.book && (
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">相關書籍</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-3">
                    {message.book.image_url && (
                      <Image
                        src={message.book.image_url || "/placeholder.svg"}
                        alt={message.book.title}
                        width={60}
                        height={80}
                        className="rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{message.book.title}</p>
                      <p className="text-sm text-muted-foreground">{message.book.author}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">{message.content}</div>
          </CardContent>
        </Card>

        {/* Reply Section */}
        {!showReply ? (
          <Button onClick={() => setShowReply(true)} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            回覆訊息
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">回覆訊息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>回覆內容</Label>
                <Textarea
                  placeholder="輸入回覆內容..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={8}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>附件（即將支援）</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    disabled
                  />
                  <Button variant="outline" size="sm" asChild disabled>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Paperclip className="w-4 h-4 mr-2" />
                      添加附件
                    </label>
                  </Button>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowReply(false)} className="flex-1">
                  取消
                </Button>
                <Button onClick={handleSendReply} disabled={sending || !replyContent.trim()} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? "發送中..." : "發送回覆"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  X,
  Edit,
  Save,
  Trash2,
  Upload,
  BookMarked,
  Building2,
  Languages,
  FileText,
  Hash,
  Tag,
  MessageCircle,
  ShoppingCart,
  BookOpen,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Book } from "@/types/bookshelf"
import { uploadBookCover } from "@/app/actions/upload-book-cover"
import { saveUserBook } from "@/app/actions/save-user-book"

interface BookDetailModalProps {
  book: Book
  userId?: string
  onClose: () => void
  onUpdate?: (updatedBook: Book) => void
  onDelete?: (bookId: string) => void
  readOnly?: boolean
}

export function BookDetailModal({ book, userId, onClose, onUpdate, onDelete, readOnly = false }: BookDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [userBookData, setUserBookData] = useState<{
    status: string
    rating: number | null
    review: string | null
  } | null>(null)

  const [formData, setFormData] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn || "",
    description: book.description || "",
    publication_year: book.publication_year?.toString() || "",
    publisher: book.publisher || "",
    edition: book.edition || "",
    language: book.language || "zh",
    pages: book.pages?.toString() || "",
    format: book.format || "paperback",
    category: book.category || "",
    image_url: book.image_url || "",
    status: "hold",
    price_cents: "",
    owner_sharing: "",
  })

  useEffect(() => {
    // Fetch user-specific book data
    async function fetchUserBookData() {
      const { data, error } = await createClient()
        .from("user_books")
        .select("*")
        .eq("book_id", book.id)
        .eq("user_id", userId)
        .maybeSingle()

      if (error) {
        console.error("[v0] Error fetching user book data:", error)
        return
      }

      if (data) {
        setUserBookData(data)
        setFormData((prev) => ({
          ...prev,
          status: data.status || "hold",
        }))
      }
    }
    fetchUserBookData()

    if (readOnly && book.owner_id) {
      async function fetchOwnerProfile() {
        const { data } = await createClient()
          .from("profiles")
          .select("username, full_name, avatar_url")
          .eq("id", book.owner_id)
          .single()

        if (data) {
          setOwnerProfile(data)
        }
      }
      fetchOwnerProfile()
    }
  }, [book.id, userId, readOnly, book.owner_id])

  useEffect(() => {
    console.log("[v0] Book prop changed, updating form data")
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      description: book.description || "",
      publication_year: book.publication_year?.toString() || "",
      publisher: book.publisher || "",
      edition: book.edition || "",
      language: book.language || "zh",
      pages: book.pages?.toString() || "",
      format: book.format || "paperback",
      category: book.category || "",
      image_url: book.image_url || "",
      status: userBookData?.status || "hold",
      price_cents: "",
      owner_sharing: "",
    })
  }, [book, book.title, book.author, book.image_url, userBookData?.status])

  const [ownerProfile, setOwnerProfile] = useState<{
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)

      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadBookCover(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.url) {
        setFormData((prev) => ({ ...prev, image_url: result.url }))
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert(`上傳圖片失敗: ${error instanceof Error ? error.message : "未知錯誤"}`)
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSave() {
    if (!formData.title || !formData.author) {
      alert("請填寫書名和作者")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn?.trim() || null,
        description: formData.description?.trim() || null,
        publication_year: formData.publication_year ? Number.parseInt(formData.publication_year) : null,
        publisher: formData.publisher?.trim() || null,
        edition: formData.edition?.trim() || null,
        language: formData.language,
        pages: formData.pages ? Number.parseInt(formData.pages) : null,
        format: formData.format,
        category: formData.category?.trim() || null,
        image_url: formData.image_url || null,
      }

      const { error: updateError } = await supabase.from("books").update(bookData).eq("id", book.id)

      if (updateError) {
        throw new Error(`更新書籍失敗: ${updateError.message}`)
      }

      await saveUserBook(book.id, formData.status)

      const updatedBook: Book = {
        ...book,
        ...bookData,
      }

      setIsEditing(false)

      if (onUpdate) {
        onUpdate(updatedBook)
      }

      alert("書籍資訊已成功更新")
    } catch (error) {
      console.error("Error saving book:", error)
      alert(error instanceof Error ? error.message : "保存失敗")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteClick() {
    if (!confirm("確定要刪除這本書嗎？")) return
    onDelete?.(book.id)
    onClose()
  }

  async function handleContactOwner(action: "borrow" | "buy") {
    const message =
      action === "borrow"
        ? `我對您的書籍「${book.title}」感興趣，想詢問是否可以借閱。`
        : `我對您的書籍「${book.title}」感興趣，想詢問購買事宜。`

    alert(`聯繫功能即將推出！\n\n訊息：${message}`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border-2 border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-border p-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold">{readOnly ? "書籍詳情" : isEditing ? "編輯書籍資料" : "書籍詳情"}</h2>
          <div className="flex items-center gap-2">
            {!readOnly && !isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border border-border">
                  <Edit className="w-4 h-4 mr-2" />
                  編輯
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="border border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  刪除
                </Button>
              </>
            ) : null}
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full border border-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {!isEditing || readOnly ? (
            // View Mode
            <div className="space-y-6">
              {/* Book Cover and Basic Info */}
              <div className="flex gap-6">
                <div className="w-48 h-72 bg-muted rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                  {formData.image_url ? (
                    <Image
                      src={formData.image_url || "/placeholder.svg"}
                      alt={formData.title}
                      width={192}
                      height={288}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">📚</div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{formData.title}</h3>
                    <p className="text-lg text-muted-foreground mb-1">作者：{formData.author}</p>
                    {formData.publisher && (
                      <p className="text-sm text-muted-foreground">出版社：{formData.publisher}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {formData.isbn && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">ISBN</p>
                        <p className="font-medium">{formData.isbn}</p>
                      </div>
                    )}
                    {formData.edition && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">版本</p>
                        <p className="font-medium">{formData.edition}</p>
                      </div>
                    )}
                    {formData.language && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">語言</p>
                        <p className="font-medium">
                          {formData.language === "zh"
                            ? "中文"
                            : formData.language === "en"
                              ? "英文"
                              : formData.language === "ja"
                                ? "日文"
                                : formData.language === "ko"
                                  ? "韓文"
                                  : "其他"}
                        </p>
                      </div>
                    )}
                    {formData.publication_year && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">出版年份</p>
                        <p className="font-medium">{formData.publication_year}</p>
                      </div>
                    )}
                    {formData.pages && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">頁數</p>
                        <p className="font-medium">{formData.pages} 頁</p>
                      </div>
                    )}
                    {formData.format && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">格式</p>
                        <p className="font-medium">
                          {formData.format === "paperback"
                            ? "平裝"
                            : formData.format === "hardcover"
                              ? "精裝"
                              : formData.format === "ebook"
                                ? "電子書"
                                : "有聲書"}
                        </p>
                      </div>
                    )}
                    {formData.category && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">分類</p>
                        <p className="font-medium">{formData.category}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">狀態</p>
                      <p className="font-medium">
                        {formData.status === "hold"
                          ? "持有"
                          : formData.status === "lending"
                            ? "可借閱"
                            : formData.status === "selling"
                              ? "出售"
                              : "私密"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {formData.description && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">書籍簡介</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formData.description}</p>
                </div>
              )}

              {readOnly && ownerProfile && (
                <div className="pt-4 border-t space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      書籍擁有者
                    </h4>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      {ownerProfile.avatar_url && (
                        <Image
                          src={ownerProfile.avatar_url || "/placeholder.svg"}
                          alt={ownerProfile.full_name || ownerProfile.username || "用戶"}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium">{ownerProfile.full_name || ownerProfile.username || "匿名用戶"}</p>
                        {ownerProfile.username && (
                          <p className="text-sm text-muted-foreground">@{ownerProfile.username}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">感興趣嗎？</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleContactOwner("borrow")}
                        className="border border-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        詢問借閱
                      </Button>
                      <Button
                        onClick={() => handleContactOwner("buy")}
                        className="border border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        詢問購買
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">點擊按鈕將向書籍擁有者發送詢問訊息</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Edit Mode - only shown when not readOnly
            <div className="space-y-4">
              {/* Cover Image Upload */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Upload className="w-4 h-4" />
                  書籍封面
                </Label>
                <div className="flex items-center gap-4">
                  {formData.image_url && (
                    <div className="w-32 h-48 bg-muted rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={formData.image_url || "/placeholder.svg"}
                        alt="Cover"
                        width={128}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                    <Input
                      type="url"
                      placeholder="或輸入圖片網址"
                      value={formData.image_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4" />
                    書名 *
                  </Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="author">作者 *</Label>
                  <Input
                    id="author"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="isbn" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    ISBN
                  </Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isbn: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="publisher" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    出版社
                  </Label>
                  <Input
                    id="publisher"
                    value={formData.publisher}
                    onChange={(e) => setFormData((prev) => ({ ...prev, publisher: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edition">版本</Label>
                  <Input
                    id="edition"
                    value={formData.edition}
                    onChange={(e) => setFormData((prev) => ({ ...prev, edition: e.target.value }))}
                    placeholder="例如: 第二版"
                  />
                </div>

                <div>
                  <Label htmlFor="year">出版年份</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) => setFormData((prev) => ({ ...prev, publication_year: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="pages" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    頁數
                  </Label>
                  <Input
                    id="pages"
                    type="number"
                    value={formData.pages}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pages: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    語言
                  </Label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                  >
                    <option value="zh">中文</option>
                    <option value="en">英文</option>
                    <option value="ja">日文</option>
                    <option value="ko">韓文</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="format">格式</Label>
                  <select
                    id="format"
                    value={formData.format}
                    onChange={(e) => setFormData((prev) => ({ ...prev, format: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                  >
                    <option value="paperback">平裝</option>
                    <option value="hardcover">精裝</option>
                    <option value="ebook">電子書</option>
                    <option value="audiobook">有聲書</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    分類
                  </Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="例如: 小說、科技"
                  />
                </div>

                <div>
                  <Label htmlFor="status">狀態</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                  >
                    <option value="private">私密</option>
                    <option value="hold">持有</option>
                    <option value="lending">可借閱</option>
                    <option value="selling">可出售</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">簡介</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 border border-gray-300"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-700"
                >
                  {loading ? (
                    "保存中..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Edit, Save, Trash2, Upload, BookMarked, Building2, Languages, FileText, Hash, Tag } from "lucide-react"
import { createClient } from "@/lib/supabase"
import type { Book } from "@/types/bookshelf"

interface BookDetailModalProps {
  book: Book
  userId: string
  onClose: () => void
  onUpdate: (updatedBook: Book) => void
  onDelete: (bookId: string) => void
}

export function BookDetailModal({ book, userId, onClose, onUpdate, onDelete }: BookDetailModalProps) {
  const supabase = createClient()
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
    status: "private",
    price_cents: "",
    owner_sharing: "",
  })

  useEffect(() => {
    // Fetch user-specific book data
    async function fetchUserBookData() {
      const { data } = await supabase
        .from("user_books")
        .select("*")
        .eq("book_id", book.id)
        .eq("user_id", userId)
        .single()

      if (data) {
        setUserBookData(data)
        setFormData((prev) => ({
          ...prev,
          status: data.status || "private",
        }))
      }
    }
    fetchUserBookData()
  }, [book.id, userId, supabase])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)

      const fileName = `${Date.now()}_${file.name}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("book-covers").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("book-covers").getPublicUrl(filePath)

      setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }))
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("上傳圖片失敗")
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSave() {
    setLoading(true)
    try {
      // Update books table
      const bookData = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn || null,
        description: formData.description || null,
        publication_year: formData.publication_year ? Number.parseInt(formData.publication_year) : null,
        publisher: formData.publisher || null,
        edition: formData.edition || null,
        language: formData.language,
        pages: formData.pages ? Number.parseInt(formData.pages) : null,
        format: formData.format,
        category: formData.category || null,
        image_url: formData.image_url || null,
      }

      const { data: updatedBook, error } = await supabase
        .from("books")
        .update(bookData)
        .eq("id", book.id)
        .select()
        .single()

      if (error) throw error

      // Update or insert user_books data
      if (userBookData) {
        await supabase
          .from("user_books")
          .update({
            status: formData.status,
          })
          .eq("book_id", book.id)
          .eq("user_id", userId)
      } else {
        await supabase.from("user_books").insert({
          book_id: book.id,
          user_id: userId,
          status: formData.status,
        })
      }

      onUpdate(updatedBook)
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving book:", error)
      alert("保存失敗")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteClick() {
    if (!confirm("確定要刪除這本書嗎？")) return
    onDelete(book.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">{isEditing ? "編輯書籍資料" : "書籍詳情"}</h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
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
        <div className="p-6">
          {!isEditing ? (
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
            </div>
          ) : (
            // Edit Mode
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
                    <option value="selling">出售</option>
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

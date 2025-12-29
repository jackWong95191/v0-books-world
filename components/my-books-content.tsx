"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  BookOpen,
  X,
  Save,
  Upload,
  BookMarked,
  Building2,
  Languages,
  FileText,
  LayoutGrid,
  Hash,
} from "lucide-react"
import Image from "next/image"
import { BookshelfView } from "@/components/bookshelf-view"
import { BookshelfSettingsDialog } from "@/components/bookshelf-settings-dialog"
import { BookDetailModal } from "@/components/book-detail-modal"
import type { Book, BookshelfPreferences } from "@/types/bookshelf"
import { saveBookshelfPreferences } from "@/app/actions/bookshelf-preferences"

export function MyBooksContent({
  initialBooks,
  initialPreferences,
  userId,
}: {
  initialBooks: Book[]
  initialPreferences: BookshelfPreferences
  userId: string
}) {
  const supabase = createClient()
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [preferences, setPreferences] = useState<BookshelfPreferences>(initialPreferences)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingBook, setIsAddingBook] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    publication_year: "",
    publisher: "",
    edition: "",
    language: "zh",
    pages: "",
    format: "paperback",
    category: "",
    image_url: "",
  })
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  useEffect(() => {
    async function fetchBooks() {
      const { data } = await supabase
        .from("books")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })

      if (data) {
        setBooks(data)
      }
    }
    fetchBooks()
  }, [supabase, userId])

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.isbn && book.isbn.includes(searchQuery)),
  )

  function openAddDialog() {
    setFormData({
      title: "",
      author: "",
      isbn: "",
      description: "",
      publication_year: "",
      publisher: "",
      edition: "",
      language: "zh",
      pages: "",
      format: "paperback",
      category: "",
      image_url: "",
    })
    setIsAddingBook(true)
    setEditingBook(null)
  }

  function openEditDialog(book: Book) {
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
    })
    setEditingBook(book)
    setIsAddingBook(true)
  }

  function closeDialog() {
    setIsAddingBook(false)
    setEditingBook(null)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("請先登入")
        return
      }

      const fileName = `${Date.now()}_${file.name}`
      const filePath = `${user.id}/${fileName}`

      const { data, error } = await supabase.storage.from("book-covers").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Upload error:", error)
        throw new Error("上傳失敗")
      }

      const { data: urlData } = supabase.storage.from("book-covers").getPublicUrl(filePath)

      setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }))
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("上傳圖片失敗")
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
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
        owner_id: userId,
      }

      if (editingBook) {
        const { error } = await supabase.from("books").update(bookData).eq("id", editingBook.id)

        if (error) throw error

        setBooks((prev) => prev.map((b) => (b.id === editingBook.id ? { ...b, ...bookData } : b)))
      } else {
        const { data, error } = await supabase.from("books").insert(bookData).select().single()

        if (error) throw error

        setBooks((prev) => [data, ...prev])
      }

      closeDialog()
    } catch (error) {
      console.error("Error saving book:", error)
      alert("保存失敗")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(bookId: string) {
    if (!confirm("確定要刪除這本書嗎？")) return

    const { error } = await supabase.from("books").delete().eq("id", bookId)

    if (!error) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
    }
  }

  async function handleSavePreferences(updates: Partial<BookshelfPreferences>) {
    try {
      console.log("[v0] Saving preferences:", updates)

      const result = await saveBookshelfPreferences(userId, preferences.id || null, updates)

      if (result.success) {
        if (result.data) {
          console.log("[v0] Created new preferences:", result.data)
          setPreferences(result.data)
        } else {
          const newPrefs = { ...preferences, ...updates }
          console.log("[v0] Updated preferences:", newPrefs)
          setPreferences(newPrefs)
        }
      }
    } catch (error) {
      console.error("Error saving preferences:", error)
      throw error
    }
  }

  return (
    <>
      {/* Header */}
      <div className="border-b border-border bg-white sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-xl font-bold text-center text-foreground mb-4">我的書架</h1>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-muted/50 rounded-full border border-gray-200">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索書名、作者或ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Button
              onClick={openAddDialog}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full px-4 py-2.5 gap-2 whitespace-nowrap border border-purple-700"
            >
              <Plus className="w-4 h-4" />
              添加
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {filteredBooks.length === 0 && !searchQuery ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">您的書架還是空的</h3>
            <p className="text-sm text-muted-foreground mb-4">使用掃描器掃描書籍或手動添加</p>
            <Button onClick={openAddDialog} className="bg-primary border border-primary">
              <Plus className="w-4 h-4 mr-2" />
              添加第一本書
            </Button>
          </div>
        ) : (
          <BookshelfView
            books={filteredBooks}
            preferences={preferences}
            onEditBook={(book) => setSelectedBook(book)}
            onDeleteBook={handleDelete}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
      </div>

      {/* Add/Edit Book Dialog */}
      {isAddingBook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gray-200">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingBook ? "編輯書籍" : "添加書籍"}</h2>
              <button onClick={closeDialog} className="p-2 hover:bg-muted rounded-full border border-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* ... existing form fields ... */}
              <div>
                <Label className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  書籍封面
                </Label>
                <div className="mt-2 flex items-center gap-4">
                  {formData.image_url && (
                    <div className="w-24 h-32 bg-muted rounded overflow-hidden">
                      <Image
                        src={formData.image_url || "/placeholder.svg"}
                        alt="Cover"
                        width={96}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="mb-2"
                    />
                    <Input
                      type="url"
                      placeholder="或輸入圖片網址"
                      value={formData.image_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

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
                    placeholder="輸入書名"
                  />
                </div>

                <div>
                  <Label htmlFor="author">作者 *</Label>
                  <Input
                    id="author"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                    placeholder="輸入作者"
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
                    placeholder="輸入ISBN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publisher" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    出版社
                  </Label>
                  <Input
                    id="publisher"
                    value={formData.publisher}
                    onChange={(e) => setFormData((prev) => ({ ...prev, publisher: e.target.value }))}
                    placeholder="輸入出版社"
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
                    placeholder="例如: 2024"
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
                    placeholder="輸入頁數"
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

                <div className="col-span-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    分類
                  </Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="例如: 小說、科技、歷史"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">簡介</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="輸入書籍簡介"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  className="flex-1 bg-transparent border border-gray-300"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-700"
                >
                  {loading ? (
                    "保存中..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingBook ? "更新" : "添加"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          userId={userId}
          onClose={() => setSelectedBook(null)}
          onUpdate={(updatedBook) => {
            setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)))
            setSelectedBook(null)
          }}
          onDelete={handleDelete}
        />
      )}

      {showSettings && (
        <BookshelfSettingsDialog
          preferences={preferences}
          onSave={handleSavePreferences}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  )
}

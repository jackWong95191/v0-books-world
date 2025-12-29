"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, FolderOpen, BrainCircuit, BookOpen, Plus, Camera, BookMarked } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface BookResult {
  title: string
  author: string
  isbn?: string
  description?: string
  publisher?: string
  edition?: string
  language?: string
  confidence: number
}

interface ScanResponse {
  books: BookResult[]
  message?: string
  error?: string
  multipleDetected?: boolean
}

type ScanMode = "single" | "multiple"

export default function ScannerPage() {
  const [scanMode, setScanMode] = useState<ScanMode | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<BookResult[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [addingBookId, setAddingBookId] = useState<string | null>(null)
  const [editingBook, setEditingBook] = useState<BookResult | null>(null)

  const scanImage = async (base64Content: string, mode: ScanMode) => {
    const response = await fetch("/api/scan-book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image: base64Content, mode }),
    })

    const data: ScanResponse = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "掃描失敗")
    }

    return data
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      setSuccessMessage(null)
      setIsLoading(true)
      setUploadedFile(file)

      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        setPreview(base64)

        const base64Content = base64.split(",")[1]

        try {
          const scanData = await scanImage(base64Content, scanMode!)

          if (scanMode === "single" && scanData.multipleDetected) {
            setError(`檢測到 ${scanData.books.length} 本書籍！單本模式只能處理一本書。正在切換至書架批量掃描模式...`)
            setTimeout(() => {
              setScanMode("multiple")
              setError(null)
              setResults(scanData.books)
              setSuccessMessage(`已切換至批量模式，檢測到 ${scanData.books.length} 本書籍`)
            }, 2500)
            setIsLoading(false)
            return
          }

          if (scanData.books.length === 0) {
            setError(scanData.message || "圖片中未檢測到書籍")
            setResults([])
          } else {
            setResults(scanData.books)
            if (scanMode === "single" && scanData.books.length > 0) {
              setEditingBook(scanData.books[0])
            }
            setSuccessMessage(scanData.message || null)
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "掃描失敗，請重試")
          setResults([])
        } finally {
          setIsLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : "處理圖片失敗")
      setResults([])
      setIsLoading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith("image/")) {
      setError("請拖放圖片檔案")
      return
    }

    try {
      setError(null)
      setSuccessMessage(null)
      setIsLoading(true)

      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        setPreview(base64)

        const base64Content = base64.split(",")[1]

        try {
          const scanData = await scanImage(base64Content, scanMode!)

          if (scanMode === "single" && scanData.multipleDetected) {
            setError(`檢測到 ${scanData.books.length} 本書籍！單本模式只能處理一本書。正在切換至書架批量掃描模式...`)
            setTimeout(() => {
              setScanMode("multiple")
              setError(null)
              setResults(scanData.books)
              setSuccessMessage(`已切換至批量模式，檢測到 ${scanData.books.length} 本書籍`)
            }, 2500)
            setIsLoading(false)
            return
          }

          if (scanData.books.length === 0) {
            setError(scanData.message || "圖片中未檢測到書籍")
            setResults([])
          } else {
            setResults(scanData.books)
            if (scanMode === "single" && scanData.books.length > 0) {
              setEditingBook(scanData.books[0])
            }
            setSuccessMessage(scanData.message || null)
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "掃描失敗，請重試")
          setResults([])
        } finally {
          setIsLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : "處理圖片失敗")
      setResults([])
      setIsLoading(false)
    }
  }

  const addToBookshelf = async (book: BookResult, index: number) => {
    try {
      const bookKey = `${book.title}-${index}`
      setAddingBookId(bookKey)
      setError(null)

      console.log("[v0] Attempting to save book:", book.title)

      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("請先登入以儲存書籍")
      }

      let coverImageUrl: string | null = null
      if (scanMode === "single" && uploadedFile) {
        const fileExt = uploadedFile.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("book-covers")
          .upload(filePath, uploadedFile)

        if (uploadError) {
          console.error("[v0] Error uploading cover:", uploadError)
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("book-covers").getPublicUrl(filePath)

          coverImageUrl = publicUrl
          console.log("[v0] Cover uploaded:", coverImageUrl)
        }
      }

      const { data: newBook, error: bookError } = await supabase
        .from("books")
        .insert({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          description: book.description,
          publisher: book.publisher,
          edition: book.edition,
          language: book.language,
          image_url: coverImageUrl,
          owner_id: user.id,
        })
        .select("id")
        .single()

      if (bookError) {
        console.error("[v0] Error saving book:", bookError)
        throw new Error(bookError.message || "儲存書籍失敗")
      }

      console.log("[v0] Book saved successfully:", newBook.id)

      setResults((prev) => prev.filter((_, i) => i !== index))
      setEditingBook(null)

      if (results.length === 1) {
        setSuccessMessage("書籍已儲存至我的書籍！")
        setPreview(null)
        setUploadedFile(null)
      }
    } catch (err) {
      console.error("[v0] Exception saving book:", err)
      setError(err instanceof Error ? err.message : "加入書籍失敗")
    } finally {
      setAddingBookId(null)
    }
  }

  const resetScanner = () => {
    setScanMode(null)
    setPreview(null)
    setResults([])
    setEditingBook(null)
    setError(null)
    setSuccessMessage(null)
    setUploadedFile(null)
  }

  if (!scanMode) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <div className="border-b border-border p-4 bg-white">
          <h1 className="text-xl font-bold text-center text-foreground">書籍掃描器</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">選擇掃描模式</p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-center text-muted-foreground mb-8">選擇您要掃描的方式</p>

            <button
              onClick={() => setScanMode("single")}
              className="w-full bg-white rounded-2xl p-6 border-2 border-border hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <BookMarked className="w-8 h-8 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg mb-2">單本書籍掃描</h3>
                  <p className="text-sm text-muted-foreground">
                    掃描單本書籍封面，獲取詳細資訊包括出版社、版本、語言等
                  </p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">詳細資訊</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">儲存封面</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">可編輯</span>
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setScanMode("multiple")}
              className="w-full bg-white rounded-2xl p-6 border-2 border-border hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FolderOpen className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg mb-2">書架批量掃描</h3>
                  <p className="text-sm text-muted-foreground">拍攝書架照片，一次識別多本書籍，快速建立書籍收藏</p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">批量識別</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">快速掃描</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">多本書籍</span>
                  </div>
                </div>
              </div>
            </button>

            <div className="mt-8 bg-accent rounded-2xl p-6 text-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">AI 書籍識別</h3>
                  <p className="text-sm text-white/90">
                    使用 Gemini 3.0 AI 技術，準確識別書籍資訊，讓您的收藏管理更輕鬆。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b border-border p-4 bg-white">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={resetScanner}>
            ← 返回
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-foreground">
              {scanMode === "single" ? "單本書籍掃描" : "書架批量掃描"}
            </h1>
          </div>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-white rounded-2xl p-6 space-y-4 border border-border">
            <div className="space-y-4">
              <h3 className="font-bold text-center mb-2">{scanMode === "single" ? "上傳書籍封面" : "上傳書架圖片"}</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {scanMode === "single" ? "選擇或拍攝清晰的書籍封面照片" : "拍攝您的書架，AI 將識別所有可見書籍"}
              </p>

              {preview ? (
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
                  <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                </div>
              ) : (
                <div
                  className="bg-muted/30 rounded-xl border-2 border-dashed border-border p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                    {scanMode === "single" ? (
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-center font-medium mb-1">點擊上傳或拍照</p>
                  <p className="text-xs text-muted-foreground">支援 JPG、PNG 格式</p>
                </div>
              )}

              {preview && (
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full gap-2">
                  <Upload className="h-5 w-5" />
                  選擇其他圖片
                </Button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture={scanMode === "single" ? "environment" : undefined}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {successMessage && !error && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="mt-6 flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                <span className="text-base font-semibold text-foreground mb-1">AI 正在識別書籍...</span>
                <span className="text-sm text-muted-foreground">請稍候片刻</span>
              </div>
            )}

            {scanMode === "single" && editingBook && !isLoading && (
              <div className="mt-6 space-y-4 border border-border rounded-xl p-4 bg-accent/5">
                <div className="flex items-center gap-2 text-accent font-semibold mb-4">
                  <BookOpen className="w-5 h-5" />
                  <span>編輯書籍資訊</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">書名 *</Label>
                    <Input
                      id="title"
                      value={editingBook.title}
                      onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                      placeholder="請輸入書名"
                    />
                  </div>

                  <div>
                    <Label htmlFor="author">作者 *</Label>
                    <Input
                      id="author"
                      value={editingBook.author}
                      onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                      placeholder="請輸入作者"
                    />
                  </div>

                  <div>
                    <Label htmlFor="publisher">出版社</Label>
                    <Input
                      id="publisher"
                      value={editingBook.publisher || ""}
                      onChange={(e) => setEditingBook({ ...editingBook, publisher: e.target.value })}
                      placeholder="請輸入出版社"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edition">版本</Label>
                      <Input
                        id="edition"
                        value={editingBook.edition || ""}
                        onChange={(e) => setEditingBook({ ...editingBook, edition: e.target.value })}
                        placeholder="例如：第一版"
                      />
                    </div>

                    <div>
                      <Label htmlFor="language">語言</Label>
                      <Input
                        id="language"
                        value={editingBook.language || ""}
                        onChange={(e) => setEditingBook({ ...editingBook, language: e.target.value })}
                        placeholder="例如：繁體中文"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={editingBook.isbn || ""}
                      onChange={(e) => setEditingBook({ ...editingBook, isbn: e.target.value })}
                      placeholder="請輸入 ISBN"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">簡介</Label>
                    <Textarea
                      id="description"
                      value={editingBook.description || ""}
                      onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
                      placeholder="請輸入書籍簡介"
                      rows={3}
                    />
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      AI 信心度: {Math.round(editingBook.confidence * 100)}%
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => addToBookshelf(editingBook, 0)}
                  disabled={addingBookId === `${editingBook.title}-0`}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                >
                  {addingBookId === `${editingBook.title}-0` ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      儲存至我的書籍
                    </>
                  )}
                </Button>
              </div>
            )}

            {scanMode === "multiple" && results.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 text-accent font-semibold">
                  <BookOpen className="w-5 h-5" />
                  <span>檢測到 {results.length} 本書籍</span>
                </div>

                {results.map((book, index) => {
                  const bookKey = `${book.title}-${index}`
                  const isAdding = addingBookId === bookKey

                  return (
                    <div key={index} className="border border-border rounded-xl p-4 space-y-3 bg-accent/5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">書名</p>
                          <p className="font-bold text-lg text-foreground">{book.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">信心度</p>
                          <p className="text-sm font-semibold text-accent">{Math.round(book.confidence * 100)}%</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">作者</p>
                        <p className="font-semibold text-foreground">{book.author}</p>
                      </div>

                      {book.isbn && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">ISBN</p>
                          <p className="font-mono text-sm text-foreground">{book.isbn}</p>
                        </div>
                      )}

                      {book.description && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">簡介</p>
                          <p className="text-sm line-clamp-3 text-foreground">{book.description}</p>
                        </div>
                      )}

                      <Button
                        onClick={() => addToBookshelf(book, index)}
                        disabled={isAdding}
                        className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-700 gap-2"
                      >
                        {isAdding ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            加入中...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            儲存至我的書籍
                          </>
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

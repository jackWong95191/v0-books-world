"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings, Plus, X, MapPin, Type } from "lucide-react"
import { BookDetailModal } from "@/components/book-detail-modal"
import { createBrowserClient } from "@/lib/supabase/client"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Book = {
  id: string
  title: string
  author: string
  image_url: string
  [key: string]: any
}

type BookstoreImage = {
  id: string
  title: string
  description: string
  image_url: string
  is_template: boolean
  store_name?: string
  name_x_percent?: number
  name_y_percent?: number
  name_font_family?: string
  name_font_size?: number
  name_text_color?: string
  name_border_color?: string
}

type BookTag = {
  id: string
  book_id: string
  x_percent: number
  y_percent: number
  books?: Book
}

type Props = {
  userId: string
  books: Book[]
  bookstoreTemplates: BookstoreImage[]
  userBookstore: BookstoreImage | null
  bookTags: BookTag[]
}

export function VirtualBookstoreContent({ userId, books, bookstoreTemplates, userBookstore, bookTags }: Props) {
  const [selectedBackground, setSelectedBackground] = useState<BookstoreImage | null>(userBookstore)
  const [tags, setTags] = useState<BookTag[]>(bookTags)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedTagForBook, setSelectedTagForBook] = useState<string | null>(null)
  const [isBookDetailOpen, setIsBookDetailOpen] = useState(false)
  const [viewedBook, setViewedBook] = useState<Book | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isDraggingName, setIsDraggingName] = useState(false)
  const [storeName, setStoreName] = useState("")
  const [nameXPercent, setNameXPercent] = useState(50)
  const [nameYPercent, setNameYPercent] = useState(10)
  const [nameFontFamily, setNameFontFamily] = useState("serif")
  const [nameFontSize, setNameFontSize] = useState(48)
  const [nameTextColor, setNameTextColor] = useState("#FFFFFF")
  const [nameBorderColor, setNameBorderColor] = useState("#000000")
  const imageRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!selectedBackground && bookstoreTemplates.length > 0) {
      setSelectedBackground(bookstoreTemplates[0])
    }
  }, [selectedBackground, bookstoreTemplates])

  useEffect(() => {
    if (selectedBackground) {
      setStoreName((selectedBackground as any).store_name || "")
      setNameXPercent((selectedBackground as any).name_x_percent || 50)
      setNameYPercent((selectedBackground as any).name_y_percent || 10)
      setNameFontFamily((selectedBackground as any).name_font_family || "serif")
      setNameFontSize((selectedBackground as any).name_font_size || 48)
      setNameTextColor((selectedBackground as any).name_text_color || "#FFFFFF")
      setNameBorderColor((selectedBackground as any).name_border_color || "#000000")
    }
  }, [selectedBackground])

  const handleBackgroundSelect = async (template: BookstoreImage) => {
    setSelectedBackground(template)

    const { data: existingBookstore } = await supabase
      .from("bookstore_images")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active_storefront", true)
      .single()

    if (existingBookstore) {
      await supabase
        .from("bookstore_images")
        .update({
          image_url: template.image_url,
          title: template.title,
          description: template.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBookstore.id)

      setSelectedBackground({ ...existingBookstore, image_url: template.image_url })
    } else {
      const { data: newBookstore } = await supabase
        .from("bookstore_images")
        .insert({
          user_id: userId,
          image_url: template.image_url,
          title: template.title,
          description: template.description,
          is_template: false,
          is_active_storefront: true,
        })
        .select()
        .single()

      if (newBookstore) {
        setSelectedBackground(newBookstore)
      }
    }

    setIsSettingsOpen(false)
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingTag || !imageRef.current || !selectedBook) return

    const rect = imageRef.current.getBoundingClientRect()
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100

    addBookTag(selectedBook.id, xPercent, yPercent)
  }

  const addBookTag = async (bookId: string, xPercent: number, yPercent: number) => {
    if (!selectedBackground) return

    const { data: newTag, error } = await supabase
      .from("book_tags")
      .insert({
        user_id: userId,
        book_id: bookId,
        bookstore_image_id: selectedBackground.id,
        x_percent: xPercent,
        y_percent: yPercent,
      })
      .select(
        `
        *,
        books (*)
      `,
      )
      .single()

    if (newTag && !error) {
      setTags([...tags, newTag])
      setIsAddingTag(false)
      setSelectedBook(null)
    }
  }

  const handleTagClick = (tag: BookTag, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDragging) return

    if (tag.books) {
      setViewedBook(tag.books)
      setIsBookDetailOpen(true)
    }
  }

  const handleDeleteTag = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    await supabase.from("book_tags").delete().eq("id", tagId)
    setTags(tags.filter((t) => t.id !== tagId))
  }

  const handleDragStart = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    setDraggedTagId(tagId)
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedTagId || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))

    setTags((prevTags) =>
      prevTags.map((tag) => (tag.id === draggedTagId ? { ...tag, x_percent: xPercent, y_percent: yPercent } : tag)),
    )
  }

  const handleDragEnd = async () => {
    if (!draggedTagId) return

    const draggedTag = tags.find((t) => t.id === draggedTagId)
    if (draggedTag) {
      await supabase
        .from("book_tags")
        .update({
          x_percent: draggedTag.x_percent,
          y_percent: draggedTag.y_percent,
        })
        .eq("id", draggedTagId)
    }

    setIsDragging(false)
    setDraggedTagId(null)
  }

  const handleNameDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingName(true)
  }

  const handleNameDragMove = (e: React.MouseEvent) => {
    if (!isDraggingName || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))

    setNameXPercent(xPercent)
    setNameYPercent(yPercent)
  }

  const handleNameDragEnd = async () => {
    if (!isDraggingName || !selectedBackground) return

    await supabase
      .from("bookstore_images")
      .update({
        name_x_percent: nameXPercent,
        name_y_percent: nameYPercent,
      })
      .eq("id", selectedBackground.id)

    setIsDraggingName(false)
  }

  const handleSaveStoreName = async () => {
    if (!selectedBackground) return

    const { error } = await supabase
      .from("bookstore_images")
      .update({
        store_name: storeName,
        name_x_percent: nameXPercent,
        name_y_percent: nameYPercent,
        name_font_family: nameFontFamily,
        name_font_size: nameFontSize,
        name_text_color: nameTextColor,
        name_border_color: nameBorderColor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedBackground.id)

    if (!error) {
      setIsEditingName(false)
      setSelectedBackground({
        ...selectedBackground,
        store_name: storeName,
        name_x_percent: nameXPercent,
        name_y_percent: nameYPercent,
        name_font_family: nameFontFamily,
        name_font_size: nameFontSize,
        name_text_color: nameTextColor,
        name_border_color: nameBorderColor,
      } as any)
    }
  }

  const handleDeleteStoreName = async () => {
    if (!selectedBackground) return

    await supabase
      .from("bookstore_images")
      .update({
        store_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedBackground.id)

    setStoreName("")
    setIsEditingName(false)
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">我的虛擬書店</h1>
          <p className="text-muted-foreground mt-1">在精美的書店背景上標記你的書籍收藏</p>
        </div>
        <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="border">
          <Settings className="mr-2 h-4 w-4" />
          更換背景
        </Button>
      </div>

      {/* Action Buttons */}
      {selectedBackground && (
        <div className="flex gap-3">
          <Button
            onClick={() => setIsEditingName(!isEditingName)}
            variant={isEditingName ? "default" : "outline"}
            className="border"
          >
            <Type className="mr-2 h-4 w-4" />
            {isEditingName ? "取消編輯店名" : "編輯書店名稱"}
          </Button>

          <Button
            onClick={() => {
              setIsAddingTag(!isAddingTag)
              setSelectedBook(null)
              setIsEditingName(false)
            }}
            variant={isAddingTag ? "default" : "outline"}
            className="border"
          >
            <Plus className="mr-2 h-4 w-4" />
            {isAddingTag ? "取消添加標記" : "添加書籍標記"}
          </Button>

          {isAddingTag && (
            <Card className="p-4 flex-1 border">
              <p className="text-sm font-medium mb-3">選擇要添加的書籍：</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {books.map((book) => (
                  <Button
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    variant={selectedBook?.id === book.id ? "default" : "outline"}
                    className="h-auto p-2 flex flex-col items-start text-left border"
                  >
                    <span className="text-xs font-medium line-clamp-1">{book.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{book.author}</span>
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Name Editing Panel */}
      {isEditingName && selectedBackground && (
        <Card className="p-4 border space-y-4">
          <h3 className="font-semibold text-foreground">書店名稱設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">書店名稱</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="輸入書店名稱"
                className="border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">字體</Label>
              <Select value={nameFontFamily} onValueChange={setNameFontFamily}>
                <SelectTrigger className="border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="serif">襯線體 (Serif)</SelectItem>
                  <SelectItem value="sans-serif">無襯線體 (Sans-serif)</SelectItem>
                  <SelectItem value="monospace">等寬字體 (Monospace)</SelectItem>
                  <SelectItem value="cursive">手寫體 (Cursive)</SelectItem>
                  <SelectItem value="fantasy">裝飾體 (Fantasy)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">字體大小 (px)</Label>
              <Input
                id="fontSize"
                type="number"
                value={nameFontSize}
                onChange={(e) => setNameFontSize(Number(e.target.value))}
                min={12}
                max={120}
                className="border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="textColor">文字顏色</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={nameTextColor}
                  onChange={(e) => setNameTextColor(e.target.value)}
                  className="w-16 h-10 p-1 border cursor-pointer"
                />
                <Input
                  type="text"
                  value={nameTextColor}
                  onChange={(e) => setNameTextColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1 border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="borderColor">文字邊框顏色</Label>
              <div className="flex gap-2">
                <Input
                  id="borderColor"
                  type="color"
                  value={nameBorderColor}
                  onChange={(e) => setNameBorderColor(e.target.value)}
                  className="w-16 h-10 p-1 border cursor-pointer"
                />
                <Input
                  type="text"
                  value={nameBorderColor}
                  onChange={(e) => setNameBorderColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1 border"
                />
              </div>
            </div>

            <div className="space-y-2 flex items-end gap-2">
              <Button onClick={handleSaveStoreName} className="flex-1 border">
                保存
              </Button>
              {storeName && (
                <Button onClick={handleDeleteStoreName} variant="destructive" className="border">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">提示：保存後可以拖動書店名稱到任意位置</p>
        </Card>
      )}

      {/* Bookstore Map */}
      {selectedBackground ? (
        <Card className="relative overflow-hidden border">
          <div
            ref={imageRef}
            className={`relative w-full aspect-[16/10] ${
              isAddingTag && selectedBook ? "cursor-crosshair" : isDraggingName ? "cursor-move" : "cursor-default"
            }`}
            onClick={handleImageClick}
            onMouseMove={(e) => {
              handleDragMove(e)
              handleNameDragMove(e)
            }}
            onMouseUp={() => {
              handleDragEnd()
              handleNameDragEnd()
            }}
            onMouseLeave={() => {
              handleDragEnd()
              handleNameDragEnd()
            }}
          >
            <Image
              src={selectedBackground.image_url || "/placeholder.svg"}
              alt={selectedBackground.title}
              fill
              className="object-cover"
              priority
            />

            {storeName && !isEditingName && (
              <div
                className="absolute group cursor-move select-none"
                style={{
                  left: `${nameXPercent}%`,
                  top: `${nameYPercent}%`,
                  transform: "translate(-50%, -50%)",
                  fontFamily: nameFontFamily,
                  fontSize: `${nameFontSize}px`,
                }}
                onMouseDown={handleNameDragStart}
              >
                <div className="relative">
                  <h2
                    className="font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all group-hover:scale-105"
                    style={{
                      color: nameTextColor,
                      WebkitTextStroke: `2px ${nameBorderColor}`,
                      paintOrder: "stroke fill",
                      textShadow: `2px 2px 4px ${nameBorderColor}, -1px -1px 2px ${nameBorderColor}`,
                    }}
                  >
                    {storeName}
                  </h2>

                  {/* Edit indicator */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditingName(true)
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-purple-700 border border-white"
                  >
                    <Type className="h-3 w-3 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Book Tags */}
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="absolute group"
                style={{
                  left: `${tag.x_percent}%`,
                  top: `${tag.y_percent}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onMouseDown={(e) => handleDragStart(tag.id, e)}
              >
                <button
                  onClick={(e) => handleTagClick(tag, e)}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all hover:scale-110 border-2 border-white ${
                    isDragging && draggedTagId === tag.id ? "scale-125" : ""
                  }`}
                >
                  <MapPin className="h-5 w-5" fill="currentColor" />

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteTag(tag.id, e)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </button>

                {/* Tooltip */}
                {tag.books && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl">
                      <p className="font-medium">{tag.books.title}</p>
                      <p className="text-gray-300">{tag.books.author}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {isAddingTag && selectedBook && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              點擊地圖添加「{selectedBook.title}」
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-12 text-center border">
          <p className="text-muted-foreground mb-4">請先選擇一個書店背景</p>
          <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="border">
            <Settings className="mr-2 h-4 w-4" />
            選擇背景
          </Button>
        </Card>
      )}

      {/* Background Selection Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>選擇書店背景</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {bookstoreTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedBackground?.image_url === template.image_url
                    ? "border-purple-600 ring-2 ring-purple-600"
                    : "border-border"
                }`}
                onClick={() => handleBackgroundSelect(template)}
              >
                <div className="relative aspect-video">
                  <Image
                    src={template.image_url || "/placeholder.svg"}
                    alt={template.title}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground">{template.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Book Detail Modal */}
      {viewedBook && (
        <BookDetailModal
          book={viewedBook}
          isOpen={isBookDetailOpen}
          onClose={() => {
            setIsBookDetailOpen(false)
            setViewedBook(null)
          }}
          onSave={async (updatedBook) => {
            window.location.reload()
          }}
          onDelete={async (bookId) => {
            setTags(tags.filter((t) => t.book_id !== bookId))
            setIsBookDetailOpen(false)
            setViewedBook(null)
          }}
        />
      )}
    </div>
  )
}

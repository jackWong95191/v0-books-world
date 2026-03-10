"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Search,
  BookOpen,
  GripVertical,
  Settings,
  ArrowLeft,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { BookshelfView } from "@/components/bookshelf-view"
import { BookshelfSettingsDialog } from "@/components/bookshelf-settings-dialog"
import { BookDetailModal } from "@/components/book-detail-modal"
import type { Book, BookshelfPreferences } from "@/types/bookshelf"

// Demo books data
const demoBooks: Book[] = [
  {
    id: "demo-1",
    title: "小王子",
    author: "安東尼·德·聖-埃克蘇佩里",
    isbn: "9789573262817",
    description: "《小王子》是法國作家安托萬·德·聖-埃克蘇佩里於1943年出版的著名小說，是世界上最暢銷的書籍之一。",
    publication_year: 1943,
    publisher: "皇冠文化",
    language: "zh",
    pages: 96,
    format: "paperback",
    category: "文學",
    image_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    owner_id: "demo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "哈利波特與魔法石",
    author: "J.K. 羅琳",
    isbn: "9789573317241",
    description: "哈利波特系列的第一本書，講述了一個孤兒男孩發現自己是巫師的故事。",
    publication_year: 1997,
    publisher: "皇冠文化",
    language: "zh",
    pages: 320,
    format: "hardcover",
    category: "奇幻",
    image_url: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=400&fit=crop",
    owner_id: "demo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    title: "三體",
    author: "劉慈欣",
    isbn: "9789573333012",
    description: "中國科幻小說的里程碑之作，講述了地球文明與外星文明的接觸。",
    publication_year: 2008,
    publisher: "貓頭鷹",
    language: "zh",
    pages: 400,
    format: "paperback",
    category: "科幻",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=400&fit=crop",
    owner_id: "demo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    title: "挪威的森林",
    author: "村上春樹",
    isbn: "9789571352169",
    description: "村上春樹最受歡迎的小說之一，講述了一段青春愛情故事。",
    publication_year: 1987,
    publisher: "時報出版",
    language: "zh",
    pages: 384,
    format: "paperback",
    category: "文學",
    image_url: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop",
    owner_id: "demo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-5",
    title: "原子習慣",
    author: "詹姆斯·克利爾",
    isbn: "9789861755267",
    description: "這本書教你如何建立好習慣、打破壞習慣，透過微小的改變，獲得巨大的成果。",
    publication_year: 2018,
    publisher: "方智",
    language: "zh",
    pages: 304,
    format: "paperback",
    category: "自我成長",
    image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop",
    owner_id: "demo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-6",
    title: "人類大歷史",
    author: "哈拉瑞",
    isbn: "9789863205449",
    description: "從認知革命、農業革命到科學革命，講述人類如何從微不足道的動物變成地球的主宰。",
    publication_year: 2014,
    publisher: "天下文化",
    language: "zh",
    pages: 488,
    format: "hardcover",
    category: "歷史",
    image_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    owner_id: "demo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const defaultPreferences: BookshelfPreferences = {
  id: "demo-pref",
  user_id: "demo",
  wood_color: "mahogany",
  wood_material: "wood",
  shelf_rows: 3,
  shelf_columns: 4,
  show_decorations: true,
  decoration_style: "minimal",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export default function DemoPage() {
  const [books] = useState<Book[]>(demoBooks)
  const [preferences, setPreferences] = useState<BookshelfPreferences>(defaultPreferences)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [reorderedBooks, setReorderedBooks] = useState<Book[]>(demoBooks)
  const [draggedBookId, setDraggedBookId] = useState<string | null>(null)

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.isbn && book.isbn.includes(searchQuery))
  )

  function handleSavePreferences(updates: Partial<BookshelfPreferences>) {
    setPreferences((prev) => ({ ...prev, ...updates }))
  }

  function handleDragStart(bookId: string) {
    setDraggedBookId(bookId)
  }

  function handleDragOver(e: React.DragEvent, targetBookId: string) {
    e.preventDefault()
    if (!draggedBookId || draggedBookId === targetBookId) return

    const draggedIndex = reorderedBooks.findIndex((b) => b.id === draggedBookId)
    const targetIndex = reorderedBooks.findIndex((b) => b.id === targetBookId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newBooks = [...reorderedBooks]
    const [draggedBook] = newBooks.splice(draggedIndex, 1)
    newBooks.splice(targetIndex, 0, draggedBook)

    setReorderedBooks(newBooks)
  }

  function handleDragEnd() {
    setDraggedBookId(null)
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-center text-sm">
        <span className="font-medium">Demo 模式</span> - 這是展示用的示例書架，
        <Link href="/auth/login" className="underline font-semibold ml-1">
          登入
        </Link>
        {" "}或{" "}
        <Link href="/auth/sign-up" className="underline font-semibold">
          註冊
        </Link>
        {" "}以創建您自己的書架
      </div>

      {/* Header */}
      <div className="border-b border-border bg-white sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回登入
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-center text-foreground">Demo 書架</h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>

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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isReorderMode ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">拖動書籍重新排序</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsReorderMode(false)}>
                  取消
                </Button>
                <Button
                  onClick={() => setIsReorderMode(false)}
                  className="bg-primary border-2 border-primary"
                >
                  完成
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {reorderedBooks.map((book) => (
                <div
                  key={book.id}
                  draggable
                  onDragStart={() => handleDragStart(book.id)}
                  onDragOver={(e) => handleDragOver(e, book.id)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move ${draggedBookId === book.id ? "opacity-50" : ""}`}
                >
                  <div className="aspect-[2/3] bg-muted rounded overflow-hidden relative">
                    <div className="absolute top-2 right-2 z-10 bg-black/50 rounded-full p-1">
                      <GripVertical className="w-4 h-4 text-white" />
                    </div>
                    {book.image_url ? (
                      <Image
                        src={book.image_url}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{book.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <BookshelfView
            key={`bookshelf-${filteredBooks.length}`}
            books={filteredBooks}
            preferences={preferences}
            onEditBook={(book) => setSelectedBook(book)}
            onDeleteBook={() => {}}
            onOpenSettings={() => setShowSettings(true)}
            onReorder={() => setIsReorderMode(true)}
          />
        )}
      </div>

      {/* Settings Dialog */}
      <BookshelfSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        preferences={preferences}
        onSave={handleSavePreferences}
      />

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onEdit={() => {}}
          onDelete={() => {}}
          isDemo={true}
        />
      )}
    </div>
  )
}

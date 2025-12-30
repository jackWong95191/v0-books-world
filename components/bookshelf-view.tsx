"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Settings, Grid3x3, Edit, Trash2, ArrowUpDown } from "lucide-react"
import type { Book, BookshelfPreferences } from "@/types/bookshelf"

interface BookshelfViewProps {
  books: Book[]
  preferences: BookshelfPreferences
  onEditBook: (book: Book) => void
  onDeleteBook: (bookId: string) => void
  onOpenSettings: () => void
  onReorder?: () => void
  readOnly?: boolean
}

export function BookshelfView({
  books,
  preferences,
  onEditBook,
  onDeleteBook,
  onOpenSettings,
  onReorder,
  readOnly = false,
}: BookshelfViewProps) {
  const { wood_color, wood_material, shelf_rows, shelf_columns } = preferences
  const [viewMode, setViewMode] = useState<"bookshelf" | "grid">("bookshelf")
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  // Calculate bookshelf dimensions
  const totalSlots = shelf_rows * shelf_columns
  const booksPerShelf = shelf_columns
  const [shelves, setShelves] = useState<Array<Book[]>>([])

  useEffect(() => {
    const newShelves = Array.from({ length: shelf_rows }, (_, shelfIndex) => {
      const startIndex = shelfIndex * booksPerShelf
      return books.slice(startIndex, startIndex + booksPerShelf)
    })

    setShelves(newShelves)
  }, [books, preferences, shelf_rows, booksPerShelf])

  // Wood color mappings
  const woodColors = {
    mahogany: "from-amber-900 via-amber-800 to-amber-900",
    oak: "from-amber-700 via-amber-600 to-amber-700",
    walnut: "from-amber-950 via-stone-900 to-amber-950",
    pine: "from-yellow-700 via-yellow-600 to-yellow-700",
    white: "from-gray-100 via-gray-50 to-gray-100",
  }

  // Border colors for wood types
  const borderColors = {
    mahogany: "border-amber-950",
    oak: "border-amber-800",
    walnut: "border-stone-950",
    pine: "border-yellow-800",
    white: "border-gray-300",
  }

  const shelfColor = woodColors[wood_color as keyof typeof woodColors] || woodColors.mahogany
  const borderColor = borderColors[wood_color as keyof typeof borderColors] || borderColors.mahogany

  const materialStyles = {
    wood: {
      pattern:
        "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
      texture: "bg-gradient-to-b from-white/30 via-transparent to-black/30",
      shine: "from-white/20 to-black/20",
    },
    laminate: {
      pattern:
        "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
      texture: "bg-gradient-to-br from-gray-50 via-stone-50 to-gray-100",
      shine: "from-white/30 to-transparent",
    },
    metal: {
      pattern: "repeating-linear-gradient(180deg, rgba(255,255,255,0.3) 0px, transparent 2px, rgba(0,0,0,0.2) 4px)",
      texture: "bg-gradient-to-b from-slate-100 to-slate-200",
      shine: "from-white/50 to-black/30",
    },
    glass: {
      pattern: "repeating-linear-gradient(0deg, rgba(255,255,255,0.2) 0px, transparent 1px, rgba(255,255,255,0.1) 2px)",
      texture: "bg-gradient-to-br from-white/70 via-transparent to-white/70",
      shine: "from-white/60 to-transparent",
    },
  }

  const currentMaterial = materialStyles[wood_material as keyof typeof materialStyles] || materialStyles.wood

  const backgroundStyles = {
    wood: "bg-gradient-to-b from-stone-50 to-stone-100",
    laminate: "bg-gradient-to-br from-gray-50 via-stone-50 to-gray-100",
    metal: "bg-gradient-to-b from-slate-100 to-slate-200",
    glass: "bg-gradient-to-br from-blue-50/30 via-transparent to-blue-50/30",
  }

  const backgroundStyle = backgroundStyles[wood_material as keyof typeof backgroundStyles] || backgroundStyles.wood

  const getBookWidth = () => {
    if (booksPerShelf <= 3) return "220px"
    if (booksPerShelf <= 5) return "160px"
    if (booksPerShelf <= 7) return "130px"
    return "110px"
  }

  const bookWidth = getBookWidth()

  if (viewMode === "grid") {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="sm" onClick={() => setViewMode("bookshelf")} className="border border-border">
            切換到書架視圖
          </Button>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="border border-border bg-transparent"
            >
              <Settings className="w-4 h-4 mr-2" />
              書架設置
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book) => (
            <div key={book.id} className="group relative">
              <div
                className="aspect-[2/3] bg-muted rounded overflow-hidden relative cursor-pointer"
                onClick={() => setSelectedBook(book)}
              >
                {book.image_url ? (
                  <Image src={book.image_url || "/placeholder.svg"} alt={book.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
                )}
                {!readOnly && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onEditBook(book)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDeleteBook(book.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6 relative z-0">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "bookshelf" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("bookshelf")}
            className="border border-border"
          >
            書架視圖
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="border border-border"
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            網格視圖
          </Button>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            {onReorder && (
              <Button variant="outline" size="sm" onClick={onReorder} className="border border-border bg-transparent">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                重新排序
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="border border-border bg-transparent"
            >
              <Settings className="w-4 h-4 mr-2" />
              書架設置
            </Button>
          </div>
        )}
      </div>

      <div className="relative rounded-lg overflow-hidden">
        <div className={`relative ${backgroundStyle} rounded-lg shadow-2xl min-h-[600px] border-4 ${borderColor} flex`}>
          <div className={`w-4 bg-gradient-to-r ${shelfColor} border-r-2 ${borderColor} flex-shrink-0 relative`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${currentMaterial.shine}`} />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: currentMaterial.pattern,
              }}
            />
          </div>

          {/* Content area with proper padding to keep books inside */}
          <div className="flex-1 px-4 py-8">
            {/* Shelves */}
            <div className="space-y-8">
              {shelves.map((shelfBooks, shelfIndex) => (
                <div key={shelfIndex} className="relative">
                  {/* Books on shelf - constrained within container */}
                  <div
                    className="flex items-end gap-4 pb-4 min-h-[180px] overflow-hidden"
                    style={{
                      justifyContent: "space-evenly",
                    }}
                  >
                    {shelfBooks.map((book) => (
                      <div
                        key={book.id}
                        className="group relative flex-shrink-0"
                        style={{
                          width: bookWidth,
                          maxWidth: bookWidth,
                        }}
                      >
                        {/* Book cover - constrained size */}
                        <div
                          className="aspect-[2/3] bg-white rounded-sm shadow-lg border border-gray-200 overflow-hidden relative hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => setSelectedBook(book)}
                        >
                          {book.image_url ? (
                            <Image
                              src={book.image_url || "/placeholder.svg"}
                              alt={book.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-gradient-to-br from-blue-100 to-blue-200">
                              <div className="text-2xl mb-1">📚</div>
                              <div className="text-[8px] text-center font-semibold line-clamp-3 px-1">{book.title}</div>
                            </div>
                          )}
                          {!readOnly && (
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 border border-gray-300"
                                onClick={() => onEditBook(book)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0 border border-red-700"
                                onClick={() => onDeleteBook(book.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Book info tooltip - positioned above, kept within viewport */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                          <div className="bg-black/90 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap max-w-[200px]">
                            <div className="font-semibold truncate">{book.title}</div>
                            <div className="text-gray-300 text-[10px] truncate">{book.author}</div>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="border-4 border-transparent border-t-black/90"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Empty slots */}
                    {Array.from({ length: booksPerShelf - shelfBooks.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="opacity-20 flex-shrink-0"
                        style={{
                          width: bookWidth,
                          maxWidth: bookWidth,
                        }}
                      >
                        <div className="aspect-[2/3] border-2 border-dashed border-gray-300 rounded-sm flex items-center justify-center">
                          <span className="text-gray-400 text-xs">空位</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`h-4 bg-gradient-to-r ${shelfColor} rounded-sm shadow-lg relative overflow-hidden border-b-2 ${borderColor}`}
                  >
                    <div className={`absolute inset-0 ${currentMaterial.texture}`} />
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: currentMaterial.pattern,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {books.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-lg font-semibold">您的書架還是空的</p>
                  <p className="text-sm mt-2">開始添加書籍吧！</p>
                </div>
              </div>
            )}
          </div>

          <div className={`w-4 bg-gradient-to-r ${shelfColor} border-l-2 ${borderColor} flex-shrink-0 relative`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${currentMaterial.shine}`} />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: currentMaterial.pattern,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

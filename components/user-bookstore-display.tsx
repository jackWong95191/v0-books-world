"use client"

import { useState } from "react"
import Image from "next/image"
import { MapPin } from "lucide-react"
import { BookDetailModal } from "./book-detail-modal"
import { BookshelfView } from "./bookshelf-view"

type Book = {
  id: string
  title: string
  author: string
  image_url?: string
  isbn?: string
  publisher?: string
  published_date?: string
  category?: string
  description?: string
  owner_id: string
}

type BookstoreImage = {
  id: string
  user_id: string
  template_url: string
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

type BookshelfPreferences = {
  id: string
  user_id: string
  wood_color: string
  wood_material: string
  shelf_rows: number
  shelf_columns: number
}

interface UserBookstoreDisplayProps {
  userId: string
  books: Book[]
  userBookstore: BookstoreImage | null
  bookTags: BookTag[]
  bookshelfPreferences: BookshelfPreferences | null
  showOnlyBookstore?: boolean
  showOnlyBookshelf?: boolean
}

export function UserBookstoreDisplay({
  userId,
  books,
  userBookstore,
  bookTags,
  bookshelfPreferences,
  showOnlyBookstore = false,
  showOnlyBookshelf = false,
}: UserBookstoreDisplayProps) {
  const [isBookDetailOpen, setIsBookDetailOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const handleBookClick = (book: Book) => {
    setSelectedBook(book)
    setIsBookDetailOpen(true)
  }

  if (showOnlyBookstore && userBookstore) {
    return (
      <div className="px-4 py-2">
        <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden shadow-2xl">
          <Image
            src={userBookstore.template_url || "/placeholder.svg"}
            alt="Virtual Bookstore"
            fill
            className="object-cover"
          />

          {/* Store Name */}
          {userBookstore.store_name && (
            <div
              className="absolute cursor-default"
              style={{
                left: `${userBookstore.name_x_percent || 50}%`,
                top: `${userBookstore.name_y_percent || 10}%`,
                transform: "translate(-50%, -50%)",
                fontFamily: userBookstore.name_font_family || "serif",
                fontSize: `${userBookstore.name_font_size || 48}px`,
                color: userBookstore.name_text_color || "#FFFFFF",
                WebkitTextStroke: `2px ${userBookstore.name_border_color || "#000000"}`,
                textShadow: `3px 3px 6px rgba(0,0,0,0.8)`,
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              {userBookstore.store_name}
            </div>
          )}

          {/* Book Tags */}
          {bookTags.map((tag) => (
            <div
              key={tag.id}
              className="absolute group"
              style={{
                left: `${tag.x_percent}%`,
                top: `${tag.y_percent}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <button
                onClick={() => tag.books && handleBookClick(tag.books)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all hover:scale-110 border-2 border-white"
              >
                <MapPin className="h-5 w-5" fill="currentColor" />
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

        {selectedBook && (
          <BookDetailModal
            isOpen={isBookDetailOpen}
            onClose={() => {
              setIsBookDetailOpen(false)
              setSelectedBook(null)
            }}
            book={selectedBook}
            userId={userId}
            readOnly={true}
            onUpdate={() => {}}
            onDelete={() => {}}
          />
        )}
      </div>
    )
  }

  if (showOnlyBookshelf) {
    const defaultPreferences: BookshelfPreferences = {
      id: "",
      user_id: userId,
      wood_color: "oak",
      wood_material: "wood",
      shelf_rows: 3,
      shelf_columns: 5,
    }

    const preferences = bookshelfPreferences || defaultPreferences

    return (
      <div className="px-4 py-2">
        <BookshelfView
          books={books}
          preferences={preferences}
          onEditBook={handleBookClick}
          onDeleteBook={() => {}}
          onOpenSettings={() => {}}
          readOnly={true}
        />

        {selectedBook && (
          <BookDetailModal
            isOpen={isBookDetailOpen}
            onClose={() => {
              setIsBookDetailOpen(false)
              setSelectedBook(null)
            }}
            book={selectedBook}
            userId={userId}
            readOnly={true}
            onUpdate={() => {}}
            onDelete={() => {}}
          />
        )}
      </div>
    )
  }

  if (userBookstore) {
    return (
      <div className="px-4 py-2">
        <h2 className="text-2xl font-bold mb-4">虛擬書店</h2>

        <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden shadow-2xl">
          <Image
            src={userBookstore.template_url || "/placeholder.svg"}
            alt="Virtual Bookstore"
            fill
            className="object-cover"
          />

          {userBookstore.store_name && (
            <div
              className="absolute cursor-default"
              style={{
                left: `${userBookstore.name_x_percent || 50}%`,
                top: `${userBookstore.name_y_percent || 10}%`,
                transform: "translate(-50%, -50%)",
                fontFamily: userBookstore.name_font_family || "serif",
                fontSize: `${userBookstore.name_font_size || 48}px`,
                color: userBookstore.name_text_color || "#FFFFFF",
                WebkitTextStroke: `2px ${userBookstore.name_border_color || "#000000"}`,
                textShadow: `3px 3px 6px rgba(0,0,0,0.8)`,
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              {userBookstore.store_name}
            </div>
          )}

          {bookTags.map((tag) => (
            <div
              key={tag.id}
              className="absolute group"
              style={{
                left: `${tag.x_percent}%`,
                top: `${tag.y_percent}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <button
                onClick={() => tag.books && handleBookClick(tag.books)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all hover:scale-110 border-2 border-white"
              >
                <MapPin className="h-5 w-5" fill="currentColor" />
              </button>

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

        {selectedBook && (
          <BookDetailModal
            isOpen={isBookDetailOpen}
            onClose={() => {
              setIsBookDetailOpen(false)
              setSelectedBook(null)
            }}
            book={selectedBook}
            userId={userId}
            readOnly={true}
            onUpdate={() => {}}
            onDelete={() => {}}
          />
        )}
      </div>
    )
  }

  const defaultPreferences: BookshelfPreferences = {
    id: "",
    user_id: userId,
    wood_color: "oak",
    wood_material: "wood",
    shelf_rows: 3,
    shelf_columns: 5,
  }

  const preferences = bookshelfPreferences || defaultPreferences

  return (
    <div className="px-4 py-2">
      <h2 className="text-2xl font-bold mb-4">書架</h2>

      <BookshelfView
        books={books}
        preferences={preferences}
        onEditBook={handleBookClick}
        onDeleteBook={() => {}}
        onOpenSettings={() => {}}
        readOnly={true}
      />

      {selectedBook && (
        <BookDetailModal
          isOpen={isBookDetailOpen}
          onClose={() => {
            setIsBookDetailOpen(false)
            setSelectedBook(null)
          }}
          book={selectedBook}
          userId={userId}
          readOnly={true}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  )
}

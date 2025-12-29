"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, User, Store, BookOpen, MapPin, Languages, ExternalLink } from "lucide-react"
import { BookDetailModal } from "@/components/book-detail-modal"
import { createBrowserClient } from "@/lib/supabase/client"
import Image from "next/image"

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  language: string | null
}

interface Bookstore {
  id: string
  user_id: string
  store_name: string | null
  image_url: string
  title: string | null
  description: string | null
  profiles: Profile
}

interface Book {
  id: string
  title: string
  author: string | null
  image_url: string | null
  publisher: string | null
  edition: string | null
  language: string | null
  category: string | null
  description: string | null
  owner_id: string
  profiles: Profile
}

interface DiscoverContentProps {
  userId: string
  initialUsers: Profile[]
  initialBookstores: Bookstore[]
  initialBooks: Book[]
}

export function DiscoverContent({ userId, initialUsers, initialBookstores, initialBooks }: DiscoverContentProps) {
  const [users, setUsers] = useState(initialUsers)
  const [bookstores, setBookstores] = useState(initialBookstores)
  const [books, setBooks] = useState(initialBooks)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("users")

  const supabase = createBrowserClient()

  const refreshRecommendations = async (type: "users" | "bookstores" | "books") => {
    setIsRefreshing(true)

    try {
      if (type === "users") {
        const { data } = await supabase.from("profiles").select("*").neq("id", userId).limit(10)
        if (data) setUsers(data)
      } else if (type === "bookstores") {
        const { data } = await supabase
          .from("bookstore_images")
          .select(
            `
            *,
            profiles!bookstore_images_user_id_fkey (
              id,
              username,
              full_name,
              avatar_url
            )
          `,
          )
          .neq("user_id", userId)
          .not("store_name", "is", null)
          .limit(10)
        if (data) setBookstores(data)
      } else if (type === "books") {
        const { data } = await supabase
          .from("books")
          .select(
            `
            *,
            profiles!books_owner_id_fkey (
              id,
              username,
              full_name,
              avatar_url
            )
          `,
          )
          .neq("owner_id", userId)
          .not("owner_id", "is", null)
          .limit(20)
        if (data) setBooks(data)
      }
    } catch (error) {
      console.error("Error refreshing recommendations:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2">探索發現</h1>
          <p className="text-center text-muted-foreground">發現其他用戶的書店、書籍和個人資料</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              用戶
            </TabsTrigger>
            <TabsTrigger value="bookstores" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              書店
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              書籍
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">推薦用戶</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshRecommendations("users")}
                disabled={isRefreshing}
                className="border"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                換一批
              </Button>
            </div>

            {users.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暫無推薦用戶</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <Card key={user.id} className="border hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.username?.charAt(0).toUpperCase() || user.full_name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {user.full_name || user.username || "匿名用戶"}
                          </CardTitle>
                          {user.username && <CardDescription className="text-xs">@{user.username}</CardDescription>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {user.bio && <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>}
                      <div className="flex flex-wrap gap-2">
                        {user.location && (
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {user.location}
                          </Badge>
                        )}
                        {user.language && (
                          <Badge variant="secondary" className="text-xs">
                            <Languages className="h-3 w-3 mr-1" />
                            {user.language}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full border bg-transparent">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        查看資料
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bookstores Tab */}
          <TabsContent value="bookstores" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">推薦書店</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshRecommendations("bookstores")}
                disabled={isRefreshing}
                className="border"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                換一批
              </Button>
            </div>

            {bookstores.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Store className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暫無推薦書店</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {bookstores.map((bookstore) => (
                  <Card key={bookstore.id} className="border overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48 w-full bg-muted">
                      <Image
                        src={bookstore.image_url || "/placeholder.svg"}
                        alt={bookstore.store_name || "Virtual Bookstore"}
                        fill
                        className="object-cover"
                      />
                      {bookstore.store_name && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <h3 className="text-white font-bold text-xl">{bookstore.store_name}</h3>
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={bookstore.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {bookstore.profiles?.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {bookstore.profiles?.full_name || bookstore.profiles?.username || "匿名用戶"}
                          </p>
                          {bookstore.profiles?.username && (
                            <p className="text-xs text-muted-foreground">@{bookstore.profiles.username}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {bookstore.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">{bookstore.description}</p>
                      </CardContent>
                    )}
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full border bg-transparent">
                        <Store className="h-4 w-4 mr-2" />
                        參觀書店
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">推薦書籍</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshRecommendations("books")}
                disabled={isRefreshing}
                className="border"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                換一批
              </Button>
            </div>

            {books.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暫無推薦書籍</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {books.map((book) => (
                  <Card
                    key={book.id}
                    className="border cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedBook(book)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[2/3] relative mb-3 bg-muted rounded-lg overflow-hidden">
                        {book.image_url ? (
                          <Image
                            src={book.image_url || "/placeholder.svg"}
                            alt={book.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">{book.title}</h3>
                      {book.author && <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{book.author}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={book.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {book.profiles?.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                          {book.profiles?.username || "匿名"}
                        </span>
                      </div>
                      {book.category && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {book.category}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetailModal
          book={{
            id: selectedBook.id,
            title: selectedBook.title,
            author: selectedBook.author || "",
            publisher: selectedBook.publisher || "",
            edition: selectedBook.edition || "",
            language: selectedBook.language || "",
            category: selectedBook.category || "",
            description: selectedBook.description || "",
            image_url: selectedBook.image_url || "",
            owner_id: selectedBook.owner_id,
          }}
          isOpen={true}
          onClose={() => setSelectedBook(null)}
          onSave={async () => {
            // Read-only mode for discovered books
          }}
          onDelete={async () => {
            // No delete for discovered books
          }}
          readOnly={true}
        />
      )}
    </div>
  )
}

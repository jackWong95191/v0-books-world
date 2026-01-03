import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Store, ShoppingCart } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch statistics
  const [usersCount, booksCount, bookstoresCount, ordersCount] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase.from("bookstore_images").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ])

  const stats = [
    {
      title: "總會員數",
      value: usersCount.count || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "總書籍數",
      value: booksCount.count || 0,
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "虛擬書店數",
      value: bookstoresCount.count || 0,
      icon: Store,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "訂單總數",
      value: ordersCount.count || 0,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">管理後台總覽</h1>
        <p className="text-muted-foreground mt-2">歡迎使用 BooksWorld 管理系統</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近註冊會員</CardTitle>
            <CardDescription>最新加入的用戶</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentUsers />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>熱門書籍</CardTitle>
            <CardDescription>最多用戶收藏的書籍</CardDescription>
          </CardHeader>
          <CardContent>
            <PopularBooks />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function RecentUsers() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  if (!users || users.length === 0) {
    return <p className="text-sm text-muted-foreground">暫無數據</p>
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user.display_name || user.username}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString("zh-TW")}</p>
        </div>
      ))}
    </div>
  )
}

async function PopularBooks() {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from("books")
    .select(
      `
      id,
      title,
      author,
      user_books (count)
    `,
    )
    .limit(5)

  if (!books || books.length === 0) {
    return <p className="text-sm text-muted-foreground">暫無數據</p>
  }

  return (
    <div className="space-y-4">
      {books.map((book) => (
        <div key={book.id} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{book.title}</p>
            <p className="text-xs text-muted-foreground">{book.author}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {Array.isArray(book.user_books) ? book.user_books.length : 0} 人收藏
          </p>
        </div>
      ))}
    </div>
  )
}

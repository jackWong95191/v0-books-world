import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

export const dynamic = "force-dynamic"

export default async function BooksPage() {
  const supabase = await createClient()

  const { data: books } = await supabase.from("books").select("*").order("created_at", { ascending: false })

  const ownerIds = books?.map((book) => book.owner_id).filter(Boolean) || []
  const { data: profiles } = await supabase.from("profiles").select("id, username, display_name").in("id", ownerIds)

  const { data: userBooksData } = await supabase.from("user_books").select("book_id")

  // Create lookup maps
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])
  const bookCountMap = new Map<string, number>()
  userBooksData?.forEach((ub) => {
    bookCountMap.set(ub.book_id, (bookCountMap.get(ub.book_id) || 0) + 1)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">書籍管理</h1>
        <p className="text-muted-foreground mt-2">查看和管理所有書籍資料</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>書籍列表</CardTitle>
          <CardDescription>共 {books?.length || 0} 本書籍</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>封面</TableHead>
                <TableHead>書名</TableHead>
                <TableHead>作者</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>擁有者</TableHead>
                <TableHead>收藏數</TableHead>
                <TableHead>新增日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books?.map((book) => {
                const owner = book.owner_id ? profileMap.get(book.owner_id) : null
                const userBookCount = bookCountMap.get(book.id) || 0

                return (
                  <TableRow key={book.id}>
                    <TableCell>
                      {book.image_url ? (
                        <Image
                          src={book.image_url || "/placeholder.svg"}
                          alt={book.title}
                          width={40}
                          height={60}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          無封面
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{book.title}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{book.author}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{book.isbn || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {owner?.display_name || owner?.username || "-"}
                    </TableCell>
                    <TableCell>{userBookCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(book.created_at).toLocaleDateString("zh-TW")}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

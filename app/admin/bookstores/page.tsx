import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export const dynamic = "force-dynamic"

export default async function BookstoresPage() {
  const supabase = await createClient()

  const { data: bookstores } = await supabase
    .from("bookstore_images")
    .select("*")
    .order("created_at", { ascending: false })

  // Fetch user profiles for bookstore owners
  const userIds = [...new Set(bookstores?.map((store) => store.user_id).filter(Boolean))]
  const { data: profiles } = await supabase.from("profiles").select("id, username, display_name").in("id", userIds)

  // Fetch book tags count for each bookstore
  const bookstoreIds = bookstores?.map((store) => store.id) || []
  const { data: tagCounts } = await supabase
    .from("book_tags")
    .select("bookstore_image_id")
    .in("bookstore_image_id", bookstoreIds)

  // Create lookup maps
  const profilesMap = new Map(profiles?.map((p) => [p.id, p]))
  const tagCountsMap = new Map<number, number>()
  tagCounts?.forEach((tag) => {
    const count = tagCountsMap.get(tag.bookstore_image_id) || 0
    tagCountsMap.set(tag.bookstore_image_id, count + 1)
  })

  // Merge data
  const bookstoresWithData = bookstores?.map((store) => ({
    ...store,
    profiles: profilesMap.get(store.user_id),
    tagCount: tagCountsMap.get(store.id) || 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">虛擬書店管理</h1>
        <p className="text-muted-foreground mt-2">查看和管理所有虛擬書店</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>書店列表</CardTitle>
          <CardDescription>共 {bookstoresWithData?.length || 0} 個虛擬書店</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>預覽</TableHead>
                <TableHead>書店名稱</TableHead>
                <TableHead>擁有者</TableHead>
                <TableHead>書籍標籤數</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>創建日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookstoresWithData?.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    {store.image_url ? (
                      <Image
                        src={store.image_url || "/placeholder.svg"}
                        alt={store.store_name || "書店"}
                        width={80}
                        height={60}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-20 h-14 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        無圖片
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{store.store_name || store.title || "未命名"}</p>
                    {store.description && <p className="text-xs text-muted-foreground mt-1">{store.description}</p>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {store.profiles?.display_name || store.profiles?.username || "-"}
                  </TableCell>
                  <TableCell>{store.tagCount}</TableCell>
                  <TableCell>
                    {store.is_active_storefront ? (
                      <Badge>啟用中</Badge>
                    ) : store.is_template ? (
                      <Badge variant="secondary">範本</Badge>
                    ) : (
                      <Badge variant="outline">未啟用</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(store.created_at).toLocaleDateString("zh-TW")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

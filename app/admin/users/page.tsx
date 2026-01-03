import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, display_name, full_name, email:contact_email, role, avatar_url, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">會員管理</h1>
        <p className="text-muted-foreground mt-2">查看和管理所有註冊會員</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>會員列表</CardTitle>
          <CardDescription>共 {users?.length || 0} 位會員</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>會員</TableHead>
                <TableHead>用戶名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>電子郵件</TableHead>
                <TableHead>註冊日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{(user.display_name || user.username || "U")[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.display_name || user.full_name || user.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>@{user.username}</TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge variant="destructive">管理員</Badge>
                    ) : user.role === "moderator" ? (
                      <Badge variant="secondary">版主</Badge>
                    ) : (
                      <Badge variant="outline">用戶</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("zh-TW")}
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

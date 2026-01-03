import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

  // Fetch user profiles for order buyers
  const userIds = [...new Set(orders?.map((order) => order.user_id).filter(Boolean))]
  const { data: profiles } = await supabase.from("profiles").select("id, username, display_name").in("id", userIds)

  // Fetch order items count for each order
  const orderIds = orders?.map((order) => order.id) || []
  const { data: orderItems } = await supabase.from("order_items").select("order_id").in("order_id", orderIds)

  // Create lookup maps
  const profilesMap = new Map(profiles?.map((p) => [p.id, p]))
  const orderItemCountsMap = new Map<string, number>()
  orderItems?.forEach((item) => {
    const count = orderItemCountsMap.get(item.order_id) || 0
    orderItemCountsMap.set(item.order_id, count + 1)
  })

  // Merge data
  const ordersWithData = orders?.map((order) => ({
    ...order,
    profiles: profilesMap.get(order.user_id),
    itemCount: orderItemCountsMap.get(order.id) || 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">訂單管理</h1>
        <p className="text-muted-foreground mt-2">查看和管理所有訂單</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>訂單列表</CardTitle>
          <CardDescription>共 {ordersWithData?.length || 0} 筆訂單</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>訂單編號</TableHead>
                <TableHead>購買者</TableHead>
                <TableHead>商品數</TableHead>
                <TableHead>總金額</TableHead>
                <TableHead>付款狀態</TableHead>
                <TableHead>配送狀態</TableHead>
                <TableHead>訂單日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersWithData?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.profiles?.display_name || order.profiles?.username || "-"}
                  </TableCell>
                  <TableCell>{order.itemCount}</TableCell>
                  <TableCell className="font-medium">${((order.total_cents || 0) / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    {order.payment_status === "succeeded" ? (
                      <Badge>已付款</Badge>
                    ) : order.payment_status === "pending" ? (
                      <Badge variant="secondary">待付款</Badge>
                    ) : (
                      <Badge variant="destructive">失敗</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.delivery_status === "delivered" ? (
                      <Badge>已送達</Badge>
                    ) : order.delivery_status === "shipped" ? (
                      <Badge variant="secondary">配送中</Badge>
                    ) : (
                      <Badge variant="outline">未出貨</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("zh-TW")}
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

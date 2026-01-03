import type React from "react"
import { checkAdminRole } from "@/lib/supabase/admin-check"
import { redirect } from "next/navigation"
import { Shield } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await checkAdminRole()

  if (!isAdmin) {
    redirect("/app/my-books")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="flex items-center gap-2 mr-4">
            <Shield className="h-5 w-5 text-red-600" />
            <span className="font-bold text-lg">管理後台</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/admin" className="transition-colors hover:text-foreground/80 text-foreground/60 font-medium">
              總覽
            </Link>
            <Link
              href="/admin/users"
              className="transition-colors hover:text-foreground/80 text-foreground/60 font-medium"
            >
              會員管理
            </Link>
            <Link
              href="/admin/books"
              className="transition-colors hover:text-foreground/80 text-foreground/60 font-medium"
            >
              書籍管理
            </Link>
            <Link
              href="/admin/bookstores"
              className="transition-colors hover:text-foreground/80 text-foreground/60 font-medium"
            >
              書店管理
            </Link>
            <Link
              href="/admin/orders"
              className="transition-colors hover:text-foreground/80 text-foreground/60 font-medium"
            >
              訂單管理
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/app/my-books"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              返回用戶界面
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="container max-w-screen-2xl py-6">{children}</main>
    </div>
  )
}

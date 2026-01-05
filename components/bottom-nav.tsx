"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Camera, BookOpen, Store, Compass, User, Shield, MessageCircle, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const ADMIN_USER_ID = "7881efa4-4809-47da-b719-2139bd41d603"

export function BottomNav() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)
        if (user.id === ADMIN_USER_ID) {
          setIsAdmin(true)
        }
      }
    }

    checkAdmin()
  }, [])

  useEffect(() => {
    if (!userId) return

    async function fetchUnreadCount() {
      const supabase = createClient()
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("is_read", false)
        .eq("is_archived", false)

      setUnreadCount(count || 0)
    }

    fetchUnreadCount()

    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const navItems = [
    { href: "/", icon: Home, label: "首頁", activeColor: "text-emerald-600" },
    { href: "/app/scanner", icon: Camera, label: "書本掃描", activeColor: "text-purple-600" },
    { href: "/app/my-books", icon: BookOpen, label: "我的書籍", activeColor: "text-blue-600" },
    { href: "/app/bookstore", icon: Store, label: "虛擬書店", activeColor: "text-orange-600" },
    { href: "/app/discover", icon: Compass, label: "探索發現", activeColor: "text-pink-600" },
    { href: "/app/messages", icon: MessageCircle, label: "訊息", activeColor: "text-cyan-600", badge: unreadCount },
    { href: "/app/book-friends", icon: Users, label: "書友", activeColor: "text-green-600" },
    { href: "/app/profile", icon: User, label: "個人資料", activeColor: "text-indigo-600" },
  ]

  if (isAdmin) {
    navItems.push({
      href: "/admin",
      icon: Shield,
      label: "管理後台",
      activeColor: "text-red-600",
    })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border py-2 px-4 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-2 px-3 relative">
              <div className={`p-2 rounded-full transition-colors ${isActive ? "bg-accent/10" : "bg-transparent"}`}>
                <item.icon
                  className={`h-5 w-5 ${isActive ? item.activeColor : "text-muted-foreground"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

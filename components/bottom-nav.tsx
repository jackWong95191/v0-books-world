"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Camera, BookOpen, Store, Compass } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: Home, label: "首頁", activeColor: "text-emerald-600" },
    { href: "/app/scanner", icon: Camera, label: "書本掃描", activeColor: "text-purple-600" },
    { href: "/app/my-books", icon: BookOpen, label: "我的書籍", activeColor: "text-blue-600" },
    { href: "/app/bookstore", icon: Store, label: "虛擬書店", activeColor: "text-orange-600" },
    { href: "/app/discover", icon: Compass, label: "探索發現", activeColor: "text-pink-600" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border py-2 px-4 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-2 px-3">
              <div className={`p-2 rounded-full transition-colors ${isActive ? "bg-accent/10" : "bg-transparent"}`}>
                <item.icon
                  className={`h-5 w-5 ${isActive ? item.activeColor : "text-muted-foreground"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
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

import type React from "react"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"

export const dynamic = "force-dynamic"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <main className="flex-1 overflow-auto pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}

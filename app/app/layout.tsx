import type React from "react"
import { BottomNav } from "@/components/bottom-nav"

export const dynamic = "force-dynamic"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-background pb-20">
      <main className="flex-1 overflow-auto">{children}</main>
      <BottomNav />
    </div>
  )
}

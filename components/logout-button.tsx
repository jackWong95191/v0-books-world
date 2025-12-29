"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

export function LogoutButton() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <Button variant="ghost" className="gap-2" onClick={handleLogout}>
      <LogOut className="h-4 w-4" />
      登出
    </Button>
  )
}

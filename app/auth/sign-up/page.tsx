"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("🔵 Starting registration for:", email)

    if (password !== confirmPassword) {
      setError("密碼不符合")
      setIsLoading(false)
      console.error("❌ Password mismatch")
      return
    }

    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            full_name: username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/app/my-books`,
        },
      })

      if (error) {
        console.error("❌ Registration error:", error)
        throw error
      }

      console.log("✅ Registration successful!")
      console.log("User:", data.user)
      console.log("Session:", data.session)

      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log("📧 Email confirmation required")
        router.push("/auth/check-email")
        return
      }

      // User is logged in immediately
      if (data.session) {
        console.log("✅ Session created, redirecting to app")
        router.push("/app/my-books")
        return
      }

      router.push("/auth/check-email")
    } catch (error: any) {
      console.error("❌ Registration failed:", error)

      // Handle specific error cases with user-friendly messages
      if (error.message?.includes("already registered") || error.message?.includes("User already registered")) {
        setError("此電子郵件已被註冊，請嘗試登入")
      } else if (error.message?.includes("Invalid email")) {
        setError("請輸入有效的電子郵件地址")
      } else if (error.message?.includes("Password")) {
        setError("密碼必須至少6個字符")
      } else if (error.message?.includes("Database error")) {
        setError("資料庫錯誤，請稍後再試或聯繫管理員")
      } else {
        setError(error.message || "註冊失敗，請重試")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">註冊 BooksWorld</CardTitle>
            <CardDescription>創建新帳戶開始管理您的書籍</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用戶名稱</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="您的名稱"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密碼</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">確認密碼</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "註冊中..." : "註冊"}
              </Button>

              <div className="text-center text-sm">
                已經有帳戶？{" "}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  登入
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

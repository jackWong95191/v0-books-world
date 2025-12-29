"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/app/my-books"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Starting login process...")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log("[v0] Login error:", error)
        throw error
      }

      console.log("[v0] Login successful, user:", data.user?.id)
      console.log("[v0] Session established:", !!data.session)

      await new Promise((resolve) => setTimeout(resolve, 100))

      window.location.href = redirectTo
    } catch (error: unknown) {
      console.log("[v0] Login failed:", error)
      const errorMessage = error instanceof Error ? error.message : "登入失敗"
      const translatedError = errorMessage === "Invalid login credentials" ? "帳號或密碼錯誤" : errorMessage
      setError(translatedError)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">登入 BooksWorld</CardTitle>
            <CardDescription>輸入您的電子郵件登入帳戶</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">密碼</Label>
                  <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                    忘記密碼？
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "登入中..." : "登入"}
              </Button>

              <div className="text-center text-sm">
                還沒有帳戶？{" "}
                <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
                  註冊
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

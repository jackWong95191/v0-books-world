"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "發送重設密碼郵件失敗")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">忘記密碼</CardTitle>
            <CardDescription>輸入您的電子郵件地址，我們將發送重設密碼連結</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">重設密碼郵件已發送！請檢查您的信箱並點擊連結重設密碼。</p>
                </div>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <ArrowLeft className="h-4 w-4" />
                    返回登入
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
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
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "發送中..." : "發送重設密碼郵件"}
                </Button>
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    返回登入
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

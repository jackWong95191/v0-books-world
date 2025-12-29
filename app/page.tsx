import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Camera, BookOpen, LogIn, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { LogoutButton } from "@/components/logout-button"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">BooksWorld</h1>
          <div className="flex gap-2">
            {!user && (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    登入
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    註冊
                  </Button>
                </Link>
              </>
            )}
            {user && (
              <>
                <Link href="/app/my-books">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <BookOpen className="h-4 w-4" />
                    我的書籍
                  </Button>
                </Link>
                <LogoutButton />
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-6">
          <h2 className="text-5xl font-bold text-pretty">掃描並整理您的書籍收藏</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            使用 AI 從圖片掃描書籍並建立您的個人數位圖書館。簡單、快速、功能強大的書籍管理。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12">
            <div className="p-6 border border-border rounded-lg bg-card/50">
              <Camera className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">AI 書籍掃描器</h3>
              <p className="text-sm text-muted-foreground">上傳書架照片，讓 AI 自動識別和提取書籍資訊</p>
            </div>

            <div className="p-6 border border-border rounded-lg bg-card/50">
              <BookOpen className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">我的書籍庫</h3>
              <p className="text-sm text-muted-foreground">組織、編輯和管理您的個人書籍收藏，包含詳細的元資料</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>2025 BooksWorld. 您的個人書籍庫管理員。</p>
        </div>
      </footer>
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">檢查您的電子郵件</CardTitle>
            <CardDescription className="text-center">
              我們已經發送確認郵件到您的信箱。請點擊郵件中的連結以啟用您的帳戶。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">如果您沒有收到郵件，請檢查垃圾郵件資料夾。</p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full bg-transparent">
                  返回登入
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

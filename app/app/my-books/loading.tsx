export default function MyBooksLoading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">載入我的書籍...</p>
      </div>
    </div>
  )
}

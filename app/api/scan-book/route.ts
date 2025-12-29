export interface BookData {
  title: string
  author: string
  isbn?: string
  description?: string
  publisher?: string
  edition?: string
  language?: string
  confidence: number
}

export interface ScanResponse {
  books: BookData[]
  message?: string
  multipleDetected?: boolean
}

export async function POST(request: Request) {
  try {
    const { base64Image, mode } = await request.json()

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Gemini API 尚未配置。請聯繫管理員添加 API 金鑰。",
        }),
        { status: 500 },
      )
    }

    const prompt =
      mode === "single"
        ? `Analyze this book cover image carefully. 

IMPORTANT: First check if there are MULTIPLE books in this image.

If MULTIPLE books are detected:
- Return ALL books found
- Set a flag indicating multiple books were detected

If SINGLE book is detected:
- Return detailed information for that one book

Extract the following information for each book:
{
  "title": "book title",
  "author": "author name", 
  "isbn": "isbn if visible",
  "description": "brief description if you can infer it",
  "publisher": "publisher name if visible",
  "edition": "edition or version (e.g., 'First Edition', '2nd Edition')",
  "language": "the language of the book (e.g., '繁體中文', 'English', '简体中文')",
  "confidence": 0.0 to 1.0 (how confident you are in this detection)
}

Return format:
{
  "books": [array of book objects],
  "count": number of books detected (1 for single, >1 for multiple)
}

IMPORTANT:
- Be thorough in extracting ALL visible information
- Accurately count the number of distinct books visible
- For language, identify the script/language used on the cover
- For edition, look for edition information on the cover
- For publisher, look for publisher logos or names
- Return ONLY valid JSON, no other text`
        : `Analyze this image carefully and identify ALL books visible in the image. Return a JSON array of all detected books.

For each book found, extract:
{
  "title": "book title",
  "author": "author name", 
  "isbn": "isbn if visible, otherwise null",
  "description": "brief description if you can infer it",
  "confidence": 0.0 to 1.0 (how confident you are in this detection)
}

Return format:
{
  "books": [array of book objects],
  "count": number of books detected
}

Important:
- If NO books are detected, return {"books": [], "count": 0}
- If multiple books are visible, return ALL of them in the array
- Only include books with confidence > 0.4
- Return ONLY valid JSON, no other text

Examples:
Single book: {"books": [{"title": "1984", "author": "George Orwell", "confidence": 0.95}], "count": 1}
Multiple books: {"books": [{"title": "Book 1", ...}, {"title": "Book 2", ...}], "count": 2}
No books: {"books": [], "count": 0}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Gemini API error:", errorText)
      return new Response(
        JSON.stringify({
          error: "AI 連接錯誤。請稍後再試或檢查網絡連接。",
        }),
        { status: 503 },
      )
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
      return new Response(
        JSON.stringify({
          error: "AI 連接錯誤。未收到回應。",
        }),
        { status: 503 },
      )
    }

    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "無法解析 AI 回應" }), { status: 400 })
    }

    const result = JSON.parse(jsonMatch[0])

    if (!result.books || result.books.length === 0) {
      return new Response(
        JSON.stringify({
          books: [],
          message: "圖片中未檢測到書籍。請確保書籍封面清晰可見。",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const detectedBooks: BookData[] = result.books
      .filter((book: any) => book.confidence >= 0.4)
      .map((book: any) => ({
        title: book.title || "Unknown",
        author: book.author || "Unknown",
        isbn: book.isbn || undefined,
        description: book.description || undefined,
        publisher: book.publisher || undefined,
        edition: book.edition || undefined,
        language: book.language || undefined,
        confidence: book.confidence || 0,
      }))

    if (detectedBooks.length === 0) {
      return new Response(
        JSON.stringify({
          books: [],
          message: "檢測到的書籍信心度較低。請嘗試更清晰的圖片。",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const multipleDetected = mode === "single" && detectedBooks.length > 1

    const responseData: ScanResponse = {
      books: detectedBooks,
      message: detectedBooks.length === 1 ? "成功識別 1 本書籍" : `成功識別 ${detectedBooks.length} 本書籍`,
      multipleDetected,
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] Error scanning book image:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? `AI 處理錯誤：${error.message}` : "掃描失敗，請重試",
      }),
      { status: 500 },
    )
  }
}

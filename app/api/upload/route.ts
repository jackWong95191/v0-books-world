import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", filename)

    // Vercel Blob's put() function handles the stream internally
    const blob = await put(filename, request.body!, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[v0] Upload successful:", blob.url)
    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Error uploading to Blob:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    )
  }
}

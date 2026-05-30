import { NextRequest, NextResponse } from 'next/server'

type ExtractedBook = { title: string; author: string }

function parseGrokJson(content: string): ExtractedBook[] {
  const trimmed = content.trim()
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/)
  const jsonStr = jsonMatch ? jsonMatch[0] : trimmed
  const parsed = JSON.parse(jsonStr)
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter((item) => item && typeof item.title === 'string')
    .map((item) => ({
      title: item.title.trim(),
      author: typeof item.author === 'string' ? item.author.trim() : '',
    }))
    .filter((item) => item.title.length > 0)
}

export async function POST(request: NextRequest) {
  try {
    const { text, grokKey } = await request.json()

    if (!text?.trim() || !grokKey?.trim()) {
      return NextResponse.json(
        { error: 'Missing text or grokKey' },
        { status: 400 }
      )
    }

    console.log('[extract] grokKey prefix:', grokKey.slice(0, 10))

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${grokKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          {
            role: 'user',
            content: `Extract all book titles from this text. Handle typos, informal names, partial titles. Return ONLY a JSON array, no markdown: [{"title": "", "author": ""}]\nText: ${text}`,
          },
        ],
      }),
    })

    console.log('[extract] Grok response status:', res.status)

    if (!res.ok) {
      const errorBody = await res.text()
      const errorMessage = errorBody || `Grok API returned status ${res.status}`
      console.log('[extract] Grok error:', errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: res.status })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      const errorMessage = 'No response content from Grok'
      console.log('[extract] Grok error:', errorMessage, JSON.stringify(data))
      return NextResponse.json({ error: errorMessage }, { status: 502 })
    }

    try {
      const books = parseGrokJson(content)
      return NextResponse.json(books)
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error
          ? parseError.message
          : 'Failed to parse Grok response as JSON'
      console.log('[extract] Parse error:', errorMessage, content)
      return NextResponse.json({ error: errorMessage }, { status: 502 })
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown server error'
    console.log('[extract] Server error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import type { Book } from '@/lib/storage'

type Recommendation = {
  type: 'next' | 'coherence' | 'flow' | 'complete'
  title: string
  author: string
  reason: string
  fromPile: boolean
}

function formatReadBooks(books: Book[]): string {
  if (books.length === 0) return 'None'
  return books
    .map(
      (book) =>
        `- ${book.title} by ${book.author} | Genre: ${book.genre.join(', ') || 'Unknown'} | Themes: ${book.themes.join(', ') || 'Unknown'} | Rating: ${book.rating ?? 'N/A'}/5`
    )
    .join('\n')
}

function formatInterestedBooks(books: Book[]): string {
  if (books.length === 0) return 'None'
  return books
    .map(
      (book) =>
        `- ${book.title} by ${book.author} | Genre: ${book.genre.join(', ') || 'Unknown'} | Themes: ${book.themes.join(', ') || 'Unknown'}`
    )
    .join('\n')
}

function parseRecommendations(content: string): Recommendation[] {
  const trimmed = content.trim().replace(/```json|```/g, '').trim()
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/)
  const jsonStr = jsonMatch ? jsonMatch[0] : trimmed
  const parsed = JSON.parse(jsonStr)
  if (!Array.isArray(parsed)) return []

  const validTypes = ['next', 'coherence', 'flow', 'complete']

  return parsed
    .filter(
      (item) =>
        item &&
        typeof item.title === 'string' &&
        typeof item.author === 'string' &&
        typeof item.reason === 'string'
    )
    .map((item) => ({
      type: validTypes.includes(item.type) ? item.type : 'next',
      title: item.title.trim(),
      author: item.author.trim(),
      reason: item.reason.trim(),
      fromPile: item.fromPile !== false,
    }))
}

export async function POST(request: NextRequest) {
  try {
    const { grokKey, readBooks, interestedBooks } = await request.json()

    if (!grokKey?.trim()) {
      return NextResponse.json({ error: 'Missing grokKey' }, { status: 400 })
    }

    if (!Array.isArray(readBooks) || readBooks.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 read books are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(interestedBooks) || interestedBooks.length === 0) {
      return NextResponse.json(
        { error: 'To-read pile is empty' },
        { status: 400 }
      )
    }

    const readList = formatReadBooks(readBooks as Book[])
    const interestedList = formatInterestedBooks(interestedBooks as Book[])

    const prompt = `You are a personal book recommendation engine.

BOOKS THIS PERSON HAS READ (with ratings):
${readList}

BOOKS IN THEIR TO-READ PILE:
${interestedList}

IMPORTANT: Only recommend books from their TO-READ PILE. Do not suggest books they haven't heard of. They already own these books.

Give FOUR recommendations from their to-read pile:

1. NEXT READ - best match to their recent reading pattern and highest rated books

2. COHERENCE - continues a theme or topic they have been exploring in their reading. Explain the thread connecting it.

3. FLOW - considers their reading rhythm. If last books were heavy/dense, suggest something lighter. If light, suggest deeper.

4. COMPLETE THE MAP - fills a gap in their knowledge based on what they have read. e.g. they read A and C in a topic, this is the missing B.

For each return:
{
  "type": "next"|"coherence"|"flow"|"complete",
  "title": string,
  "author": string,
  "reason": string (3 sentences, specific and personal, mention actual books they read),
  "fromPile": true
}

If to-read pile has fewer than 4 books, return as many as possible.
Return ONLY JSON array, no markdown.`

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${grokKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4.3',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      return NextResponse.json(
        { error: errorBody || `Grok API returned status ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'No response content from Grok' },
        { status: 502 }
      )
    }

    try {
      const recommendations = parseRecommendations(content)
      if (recommendations.length === 0) {
        return NextResponse.json(
          { error: 'Could not parse recommendations from Grok response' },
          { status: 502 }
        )
      }
      return NextResponse.json(recommendations)
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error
          ? parseError.message
          : 'Failed to parse Grok response as JSON'
      return NextResponse.json({ error: errorMessage }, { status: 502 })
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

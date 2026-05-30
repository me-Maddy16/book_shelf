import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { base64Image, grokKey } = await request.json()

    if (!base64Image?.trim() || !grokKey?.trim()) {
      return NextResponse.json(
        { error: 'Missing base64Image or grokKey' },
        { status: 400 }
      )
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${grokKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-4.3",
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            },
            {
              type: "text",
              text: "Look carefully at this bookshelf image. List every book you can see by reading the spines and covers. Return ONLY a JSON array with no markdown: [{\"title\": \"\", \"author\": \"\"}]. If author is unclear just put empty string."
            }
          ]
        }],
        max_tokens: 1000
      })
    })

    const data = await response.json()
    const text = data.choices[0].message.content
    const cleaned = text.replace(/```json|```/g, "").trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

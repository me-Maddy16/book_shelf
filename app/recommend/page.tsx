'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ApiGuard from '@/components/ApiGuard'
import { getApiKeys, getBooks, type Book } from '@/lib/storage'

type Recommendation = {
  type: 'next' | 'coherence' | 'flow' | 'complete'
  title: string
  author: string
  reason: string
  fromPile: boolean
}

type DisplayRecommendation = Recommendation & { thumbnail: string }

const pageStyle = {
  minHeight: '100vh',
  backgroundColor: '#030712',
  padding: '20px',
  fontFamily: 'system-ui, sans-serif',
} as const

const buttonStyle = {
  width: '100%',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  padding: '14px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
}

const badgeConfig = {
  next: { label: 'NEXT READ 📖', bg: '#1e3a8a', color: '#93c5fd' },
  coherence: { label: 'COHERENCE 🔗', bg: '#052e16', color: '#4ade80' },
  flow: { label: 'FLOW 🌊', bg: '#4c1d95', color: '#c4b5fd' },
  complete: { label: 'COMPLETE 🗺️', bg: '#7c2d12', color: '#fdba74' },
} as const

async function fetchCover(
  title: string,
  author: string,
  googleBooksKey: string
): Promise<string> {
  const q = encodeURIComponent(`${title} ${author}`.trim())
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${q}&key=${googleBooksKey}&maxResults=1`
  )
  if (!res.ok) return ''
  const data = await res.json()
  return (
    data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail?.replace(
      'http://',
      'https://'
    ) ?? ''
  )
}

async function fetchRecommendations(
  grokKey: string,
  readBooks: Book[],
  interestedBooks: Book[]
): Promise<DisplayRecommendation[]> {
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grokKey, readBooks, interestedBooks }),
  })

  const data = await res.json()

  if (!res.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : `Request failed with status ${res.status}`
    throw new Error(message)
  }

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response from recommend API')
  }

  const keys = getApiKeys()
  const googleBooksKey = keys?.googleBooksKey ?? ''

  return Promise.all(
    (data as Recommendation[]).map(async (rec) => ({
      ...rec,
      thumbnail: googleBooksKey
        ? await fetchCover(rec.title, rec.author, googleBooksKey)
        : '',
    }))
  )
}

export default function RecommendPage() {
  const [readBooks, setReadBooks] = useState<Book[]>([])
  const [interestedBooks, setInterestedBooks] = useState<Book[]>([])
  const [recommendations, setRecommendations] = useState<
    DisplayRecommendation[]
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    const books = getBooks()
    setReadBooks(books.filter((b) => b.status === 'read'))
    setInterestedBooks(books.filter((b) => b.status === 'interested'))
  }, [])

  const hasEnoughRead = readBooks.length >= 3
  const hasToReadPile = interestedBooks.length > 0
  const canRecommend = hasEnoughRead && hasToReadPile

  const handleGetRecommendations = async () => {
    const keys = getApiKeys()
    if (!keys) {
      setError('API keys not found. Please add them in settings.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const results = await fetchRecommendations(
        keys.grokKey,
        readBooks,
        interestedBooks
      )
      setRecommendations(results)
      setHasFetched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ApiGuard>
      <div style={pageStyle}>
        {!hasEnoughRead && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            textAlign: 'center',
            maxWidth: '420px',
            margin: '0 auto',
          }}>
            <p style={{
              color: '#9ca3af',
              fontSize: '16px',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
            }}>
              Read at least 3 books first
            </p>
            <Link
              href="/add"
              style={{
                ...buttonStyle,
                display: 'inline-block',
                textDecoration: 'none',
                textAlign: 'center',
                maxWidth: '280px',
              }}
            >
              Add Books
            </Link>
          </div>
        )}

        {hasEnoughRead && !hasToReadPile && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            textAlign: 'center',
            maxWidth: '420px',
            margin: '0 auto',
          }}>
            <p style={{
              color: '#9ca3af',
              fontSize: '16px',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
            }}>
              Scan your shelf first to build your to-read pile
            </p>
            <Link
              href="/shelf"
              style={{
                ...buttonStyle,
                display: 'inline-block',
                textDecoration: 'none',
                textAlign: 'center',
                maxWidth: '280px',
              }}
            >
              Scan Shelf
            </Link>
          </div>
        )}

        {canRecommend && loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
          }}>
            <p style={{ color: '#9ca3af', fontSize: '18px' }}>
              Finding your next reads...
            </p>
          </div>
        )}

        {canRecommend && !loading && !hasFetched && (
          <div style={{
            maxWidth: '420px',
            margin: '0 auto',
            paddingTop: '40px',
          }}>
            <h1 style={{
              color: '#ffffff',
              fontSize: '26px',
              fontWeight: 'bold',
              textAlign: 'center',
              margin: '0 0 32px 0',
            }}>
              Your Next Reads
            </h1>

            {error && (
              <p style={{
                color: '#f87171',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleGetRecommendations}
              style={buttonStyle}
            >
              Get Recommendations
            </button>
          </div>
        )}

        {canRecommend && !loading && hasFetched && (
          <div style={{ maxWidth: '560px', margin: '0 auto', paddingBottom: '24px' }}>
            <h1 style={{
              color: '#ffffff',
              fontSize: '26px',
              fontWeight: 'bold',
              margin: '0 0 24px 0',
            }}>
              Your Next Reads
            </h1>

            {error && (
              <p style={{
                color: '#f87171',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recommendations.map((rec) => {
                const badge = badgeConfig[rec.type] ?? badgeConfig.next
                return (
                  <div
                    key={`${rec.type}-${rec.title}`}
                    style={{
                      backgroundColor: '#111827',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #374151',
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      marginBottom: '12px',
                      letterSpacing: '0.03em',
                    }}>
                      {badge.label}
                    </span>

                    <div style={{ display: 'flex', gap: '14px' }}>
                      {rec.thumbnail ? (
                        <img
                          src={rec.thumbnail}
                          alt={rec.title}
                          style={{
                            width: '80px',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '80px',
                          height: '120px',
                          backgroundColor: '#374151',
                          borderRadius: '6px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                        }}>
                          📚
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          color: '#ffffff',
                          fontSize: '16px',
                          fontWeight: '700',
                          margin: '0 0 4px 0',
                          lineHeight: 1.3,
                        }}>
                          {rec.title}
                        </p>
                        <p style={{
                          color: '#9ca3af',
                          fontSize: '13px',
                          margin: '0 0 10px 0',
                        }}>
                          {rec.author}
                        </p>
                        <p style={{
                          color: '#d1d5db',
                          fontSize: '13px',
                          fontStyle: 'italic',
                          margin: 0,
                          lineHeight: 1.5,
                        }}>
                          {rec.reason}
                        </p>
                        <span style={{
                          display: 'inline-block',
                          marginTop: '10px',
                          backgroundColor: '#052e16',
                          color: '#4ade80',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '12px',
                        }}>
                          In your pile ✓
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleGetRecommendations}
              style={{ ...buttonStyle, marginTop: '24px' }}
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </ApiGuard>
  )
}

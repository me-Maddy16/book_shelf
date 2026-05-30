'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ApiGuard from '@/components/ApiGuard'
import { addBook, getApiKeys, type Book } from '@/lib/storage'

type DetectedBook = { title: string; author: string }

type ScannedBook = {
  id: string
  title: string
  author: string
  thumbnail: string
  genre: string[]
  description: string
  pageCount: number
  themes: string[]
}

type GoogleVolumeInfo = {
  title?: string
  authors?: string[]
  categories?: string[]
  description?: string
  imageLinks?: { thumbnail?: string }
  pageCount?: number
}

const pageStyle = {
  minHeight: '100vh',
  backgroundColor: '#030712',
  padding: '20px',
  fontFamily: 'system-ui, sans-serif',
} as const

const inputStyle = {
  width: '100%',
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '10px',
  padding: '12px',
  color: '#ffffff',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  resize: 'vertical' as const,
  lineHeight: 1.5,
}

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

const dividerStyle = {
  color: '#6b7280',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

function extractThemes(description: string): string[] {
  if (!description) return []
  const stopWords = new Set([
    'about', 'after', 'also', 'been', 'book', 'from', 'have', 'into',
    'more', 'novel', 'other', 'story', 'that', 'their', 'them', 'then',
    'these', 'they', 'this', 'through', 'were', 'what', 'when', 'which',
    'while', 'with', 'would', 'your',
  ])
  const words = description
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !stopWords.has(w))
  return [...new Set(words)].slice(0, 4)
}

async function scanShelf(
  base64Image: string,
  grokKey: string
): Promise<DetectedBook[]> {
  const res = await fetch('/api/scan-shelf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, grokKey }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : `Request failed with status ${res.status}`
    )
  }

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response from scan API')
  }

  return data
}

async function extractBooksFromText(
  text: string,
  grokKey: string
): Promise<DetectedBook[]> {
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, grokKey }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : `Request failed with status ${res.status}`
    )
  }

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response from extract API')
  }

  return data
}

async function fetchGoogleBook(
  title: string,
  author: string,
  googleBooksKey: string
): Promise<GoogleVolumeInfo | null> {
  const q = encodeURIComponent(`${title} ${author}`.trim())
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${q}&key=${googleBooksKey}&maxResults=1`
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0]?.volumeInfo ?? null
}

function buildScannedBook(
  detected: DetectedBook,
  volume: GoogleVolumeInfo | null
): ScannedBook {
  const description = volume?.description ?? ''
  return {
    id: crypto.randomUUID(),
    title: volume?.title ?? detected.title,
    author: volume?.authors?.join(', ') ?? detected.author,
    genre: volume?.categories ?? [],
    themes: extractThemes(description),
    description,
    thumbnail:
      volume?.imageLinks?.thumbnail?.replace('http://', 'https://') ?? '',
    pageCount: volume?.pageCount ?? 0,
  }
}

async function enrichBooks(
  detected: DetectedBook[],
  googleBooksKey: string
): Promise<ScannedBook[]> {
  return Promise.all(
    detected.map(async (item) => {
      const volume = await fetchGoogleBook(item.title, item.author, googleBooksKey)
      return buildScannedBook(item, volume)
    })
  )
}

function toBook(scanned: ScannedBook, addedVia: 'text' | 'scan'): Book {
  return {
    ...scanned,
    status: 'interested',
    rating: null,
    note: null,
    addedVia,
    dateAdded: new Date().toISOString(),
  }
}

export default function ShelfPage() {
  const router = useRouter()
  const shelfInputRef = useRef<HTMLInputElement>(null)
  const [inputText, setInputText] = useState('')
  const [books, setBooks] = useState<ScannedBook[]>([])
  const [bookSources, setBookSources] = useState<Record<string, 'text' | 'scan'>>({})
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState('')
  const [scanWarning, setScanWarning] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleShelfPhoto = async (file: File) => {
    const keys = getApiKeys()
    if (!keys) {
      setError('API keys not found. Please add them in settings.')
      return
    }

    setError('')
    setScanWarning('')
    setPreviewUrl(URL.createObjectURL(file))
    setLoading(true)
    setLoadingMessage('Scanning shelf...')

    try {
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1] ?? result)
        }
        reader.onerror = () => reject(new Error('Failed to read image'))
        reader.readAsDataURL(file)
      })

      const detected = await scanShelf(base64Image, keys.grokKey)

      if (detected.length === 0) {
        setScanWarning(
          "Couldn't detect books clearly. Try better lighting or a closer shot."
        )
        return
      }

      const enriched = await enrichBooks(detected, keys.googleBooksKey)
      setBooks((prev) => [...prev, ...enriched])
      setBookSources((prev) => {
        const next = { ...prev }
        enriched.forEach((book) => {
          next[book.id] = 'scan'
        })
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingMessage('')
      if (shelfInputRef.current) shelfInputRef.current.value = ''
    }
  }

  const handleAddFromText = async () => {
    if (!inputText.trim()) {
      setError('Please type some book names')
      return
    }

    const keys = getApiKeys()
    if (!keys) {
      setError('API keys not found. Please add them in settings.')
      return
    }

    setError('')
    setLoading(true)
    setLoadingMessage('Finding your books...')

    try {
      const detected = await extractBooksFromText(inputText, keys.grokKey)
      if (detected.length === 0) {
        throw new Error('No books found in your text. Try adding more detail.')
      }

      const enriched = await enrichBooks(detected, keys.googleBooksKey)
      setBooks((prev) => [...prev, ...enriched])
      setBookSources((prev) => {
        const next = { ...prev }
        enriched.forEach((book) => {
          next[book.id] = 'text'
        })
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  const handleAddAll = () => {
    books.forEach((book) => addBook(toBook(book, bookSources[book.id] ?? 'scan')))
    setSaveSuccess(true)
    setTimeout(() => router.push('/library'), 1500)
  }

  return (
    <ApiGuard>
      <div style={{ ...pageStyle, paddingBottom: books.length > 0 ? '100px' : '20px' }}>
        <h1
          style={{
            color: '#ffffff',
            fontSize: '26px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
          }}
        >
          Scan Your Shelf
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Take a photo of your bookshelf and we&apos;ll find all the books
        </p>

        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <input
            ref={shelfInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleShelfPhoto(file)
            }}
          />

          <button
            type="button"
            onClick={() => shelfInputRef.current?.click()}
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '220px',
              backgroundColor: '#111827',
              border: '2px dashed #374151',
              borderRadius: '16px',
              padding: '32px 20px',
              cursor: loading ? 'default' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: '56px' }} aria-hidden>
              📸
            </span>
            <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>
              Tap to photograph your shelf
            </span>
          </button>

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Shelf preview"
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                marginTop: '16px',
                border: '1px solid #374151',
              }}
            />
          )}

          {scanWarning && (
            <p style={{
              color: '#fbbf24',
              fontSize: '14px',
              textAlign: 'center',
              marginTop: '16px',
              lineHeight: 1.5,
            }}>
              {scanWarning}
            </p>
          )}

          <p style={dividerStyle}>── or type book names ──</p>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type books you own but haven't read...\ne.g. Deep Work, Zero to One,\nThinking Fast and Slow`}
            rows={4}
            style={inputStyle}
          />

          <button
            type="button"
            onClick={handleAddFromText}
            disabled={loading}
            style={{ ...buttonStyle, marginTop: '16px', opacity: loading ? 0.6 : 1 }}
          >
            Add to Pile
          </button>

          {loading && (
            <p style={{
              color: '#9ca3af',
              fontSize: '14px',
              textAlign: 'center',
              marginTop: '16px',
            }}>
              {loadingMessage}
            </p>
          )}

          {error && (
            <p style={{
              color: '#f87171',
              fontSize: '14px',
              textAlign: 'center',
              marginTop: '16px',
            }}>
              {error}
            </p>
          )}

          {books.length > 0 && (
            <>
              <h2
                style={{
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: '700',
                  margin: '32px 0 0 0',
                }}
              >
                Found {books.length} book{books.length === 1 ? '' : 's'}
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '12px',
                  marginTop: '20px',
                }}
              >
                {books.map((book) => (
                  <div
                    key={book.id}
                    style={{
                      backgroundColor: '#111827',
                      borderRadius: '12px',
                      padding: '12px',
                      border: '1px solid #374151',
                      position: 'relative',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setBooks((prev) => prev.filter((b) => b.id !== book.id))
                      }
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#374151',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        lineHeight: '24px',
                        padding: 0,
                      }}
                      aria-label="Remove book"
                    >
                      ✕
                    </button>

                    {book.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        style={{
                          width: '100%',
                          height: '160px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '10px',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '160px',
                          backgroundColor: '#374151',
                          borderRadius: '8px',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                        }}
                      >
                        📚
                      </div>
                    )}

                    <p
                      style={{
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '700',
                        margin: '0 0 4px 0',
                        lineHeight: 1.3,
                        paddingRight: '20px',
                      }}
                    >
                      {book.title}
                    </p>
                    <p
                      style={{
                        color: '#9ca3af',
                        fontSize: '11px',
                        margin: '0 0 8px 0',
                      }}
                    >
                      {book.author || 'Unknown author'}
                    </p>
                    {book.genre[0] && (
                      <span
                        style={{
                          backgroundColor: '#1f2937',
                          color: '#60a5fa',
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {book.genre[0]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {books.length > 0 && (
          saveSuccess ? (
            <p
              style={{
                color: '#4ade80',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'center',
                marginTop: '32px',
              }}
            >
              ✓ {books.length} book{books.length === 1 ? '' : 's'} added to your pile!
            </p>
          ) : (
            <button
              type="button"
              onClick={handleAddAll}
              style={{
                ...buttonStyle,
                position: 'fixed',
                bottom: '24px',
                left: '20px',
                right: '20px',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              Save to To-Read List
            </button>
          )
        )}
      </div>
    </ApiGuard>
  )
}

'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ApiGuard from '@/components/ApiGuard'
import { addBook, getApiKeys, type Book } from '@/lib/storage'

type ExtractedBook = { title: string; author: string }

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

async function extractBooksFromText(
  text: string,
  grokKey: string
): Promise<ExtractedBook[]> {
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

async function scanCover(
  base64Image: string,
  grokKey: string
): Promise<ExtractedBook[]> {
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

function buildBook(
  extracted: ExtractedBook,
  volume: GoogleVolumeInfo | null,
  addedVia: 'text' | 'scan'
): Book {
  const description = volume?.description ?? ''
  const thumbnail = volume?.imageLinks?.thumbnail?.replace('http://', 'https://') ?? ''

  return {
    id: crypto.randomUUID(),
    title: volume?.title ?? extracted.title,
    author: volume?.authors?.join(', ') ?? extracted.author,
    genre: volume?.categories ?? [],
    themes: extractThemes(description),
    description,
    thumbnail,
    pageCount: volume?.pageCount ?? 0,
    status: 'read',
    rating: null,
    note: null,
    addedVia,
    dateAdded: new Date().toISOString(),
  }
}

async function enrichBooks(
  detected: ExtractedBook[],
  googleBooksKey: string,
  addedVia: 'text' | 'scan'
): Promise<Book[]> {
  return Promise.all(
    detected.map(async (item) => {
      const volume = await fetchGoogleBook(item.title, item.author, googleBooksKey)
      return buildBook(item, volume, addedVia)
    })
  )
}

function PreviewGrid({
  books,
  onRate,
  onRemove,
}: {
  books: Book[]
  onRate: (id: string, rating: number) => void
  onRemove: (id: string) => void
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '16px',
      marginTop: '32px',
    }}>
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
            onClick={() => onRemove(book.id)}
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
                height: '180px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '10px',
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '180px',
              backgroundColor: '#374151',
              borderRadius: '8px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '32px',
            }}>
              📚
            </div>
          )}
          <p style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            margin: '0 0 4px 0',
            lineHeight: 1.3,
            paddingRight: '20px',
          }}>
            {book.title}
          </p>
          <p style={{
            color: '#9ca3af',
            fontSize: '12px',
            margin: '0 0 10px 0',
          }}>
            {book.author || 'Unknown author'}
          </p>

          <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onRate(book.id, star)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 2px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                  color: book.rating !== null && star <= book.rating
                    ? '#fbbf24'
                    : '#4b5563',
                }}
                aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
              >
                ★
              </button>
            ))}
          </div>

          {book.genre.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {book.genre.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: '#1f2937',
                    color: '#60a5fa',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AddPage() {
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [inputText, setInputText] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleFindBooks = async () => {
    if (!inputText.trim()) {
      setError('Please describe the books you have read')
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
      const extracted = await extractBooksFromText(inputText, keys.grokKey)
      if (extracted.length === 0) {
        throw new Error('No books found in your text. Try adding more detail.')
      }

      const enriched = await enrichBooks(extracted, keys.googleBooksKey, 'text')
      setBooks((prev) => [...prev, ...enriched])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  const handleCoverSelect = async (file: File) => {
    const keys = getApiKeys()
    if (!keys) {
      setError('API keys not found. Please add them in settings.')
      return
    }

    setError('')
    setLoading(true)
    setLoadingMessage('Scanning cover...')

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

      const detected = await scanCover(base64Image, keys.grokKey)
      if (detected.length === 0) {
        throw new Error('Could not detect a book from this cover. Try a clearer photo.')
      }

      const enriched = await enrichBooks(detected, keys.googleBooksKey, 'scan')
      setBooks((prev) => [...prev, ...enriched])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingMessage('')
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const setRating = (id: string, rating: number) => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === id
          ? { ...book, rating: book.rating === rating ? null : rating }
          : book
      )
    )
  }

  const handleSave = () => {
    books.forEach((book) => addBook(book))
    setSaveSuccess(true)
    setTimeout(() => router.push('/'), 1500)
  }

  return (
    <ApiGuard>
      <div style={{ ...pageStyle, paddingBottom: books.length > 0 ? '100px' : '20px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <h1 style={{
            color: '#ffffff',
            fontSize: '26px',
            fontWeight: 'bold',
            margin: '0 0 24px 0',
          }}>
            Add Books You&apos;ve Read
          </h1>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type naturally...\ne.g. I read Atomic Habits, Sapiens,\nThe Alchemist and Ikigai`}
            rows={4}
            style={inputStyle}
          />

          <button
            type="button"
            onClick={handleFindBooks}
            disabled={loading}
            style={{ ...buttonStyle, marginTop: '20px', opacity: loading ? 0.6 : 1 }}
          >
            Find My Books
          </button>

          <p style={dividerStyle}>── or scan a cover ──</p>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleCoverSelect(file)
            }}
          />

          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '140px',
              backgroundColor: '#111827',
              border: '2px dashed #374151',
              borderRadius: '16px',
              padding: '24px 20px',
              cursor: loading ? 'default' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: '40px' }} aria-hidden>
              📸
            </span>
            <span style={{ color: '#ffffff', fontSize: '15px', fontWeight: '600' }}>
              Tap to scan a book cover
            </span>
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
              marginTop: '16px',
              textAlign: 'center',
            }}>
              {error}
            </p>
          )}

          {books.length > 0 && (
            <>
              <h2 style={{
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '700',
                margin: '32px 0 0 0',
              }}>
                Found {books.length} book{books.length === 1 ? '' : 's'}
              </h2>

              <PreviewGrid
                books={books}
                onRate={setRating}
                onRemove={(id) => setBooks((prev) => prev.filter((b) => b.id !== id))}
              />
            </>
          )}
        </div>

        {books.length > 0 && (
          saveSuccess ? (
            <p style={{
              color: '#4ade80',
              fontSize: '16px',
              fontWeight: '600',
              textAlign: 'center',
              marginTop: '32px',
            }}>
              ✓ {books.length} book{books.length === 1 ? '' : 's'} added!
            </p>
          ) : (
            <button
              type="button"
              onClick={handleSave}
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
              Save to Library
            </button>
          )
        )}
      </div>
    </ApiGuard>
  )
}

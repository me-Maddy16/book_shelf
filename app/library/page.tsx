'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ApiGuard from '@/components/ApiGuard'
import { getBooks, saveBooks, updateBook, type Book } from '@/lib/storage'

type Tab = 'read' | 'interested'

const pageStyle = {
  minHeight: '100vh',
  backgroundColor: '#030712',
  padding: '20px',
  fontFamily: 'system-ui, sans-serif',
} as const

const buttonStyle = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 16px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
} as const

const subtleButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#9ca3af',
  fontSize: '12px',
  cursor: 'pointer',
  padding: '2px 0',
  whiteSpace: 'nowrap' as const,
}

function StarRating({
  rating,
  onRate,
}: {
  rating: number | null
  onRate: (rating: number) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          style={{
            background: 'none',
            border: 'none',
            padding: '0 1px',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            color:
              rating !== null && star <= rating ? '#fbbf24' : '#4b5563',
          }}
          aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function BookCover({ thumbnail, title }: { thumbnail: string; title: string }) {
  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt={title}
        style={{
          width: '50px',
          height: '75px',
          objectFit: 'cover',
          borderRadius: '4px',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: '50px',
        height: '75px',
        backgroundColor: '#374151',
        borderRadius: '4px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
      }}
    >
      📚
    </div>
  )
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [tab, setTab] = useState<Tab>('read')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [inlineRatingBookId, setInlineRatingBookId] = useState<string | null>(
    null
  )

  const loadBooks = () => setBooks(getBooks())

  useEffect(() => {
    loadBooks()
  }, [])

  const readBooks = books.filter((b) => b.status === 'read')
  const toReadBooks = books.filter((b) => b.status === 'interested')
  const visibleBooks = tab === 'read' ? readBooks : toReadBooks

  const handleRate = (id: string, rating: number) => {
    const book = books.find((b) => b.id === id)
    const newRating = book?.rating === rating ? null : rating
    updateBook(id, { rating: newRating })
    loadBooks()
  }

  const handleDelete = (id: string) => {
    saveBooks(getBooks().filter((b) => b.id !== id))
    setDeleteConfirmId(null)
    loadBooks()
  }

  const handleMarkAsRead = (id: string, rating: number) => {
    updateBook(id, { status: 'read', rating })
    setInlineRatingBookId(null)
    loadBooks()
  }

  const handleMoveToInterested = (id: string) => {
    updateBook(id, { status: 'interested', rating: null })
    loadBooks()
  }

  return (
    <ApiGuard>
      <div style={pageStyle}>
        <h1
          style={{
            color: '#ffffff',
            fontSize: '26px',
            fontWeight: 'bold',
            margin: '0 0 20px 0',
          }}
        >
          My Library
        </h1>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            borderBottom: '1px solid #374151',
            marginBottom: '20px',
          }}
        >
          {(
            [
              { key: 'read' as Tab, label: 'Read', count: readBooks.length },
              {
                key: 'interested' as Tab,
                label: 'To Read',
                count: toReadBooks.length,
              },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0 0 12px 0',
                cursor: 'pointer',
                color: tab === key ? '#ffffff' : '#9ca3af',
                fontSize: '15px',
                fontWeight: tab === key ? '600' : '500',
                borderBottom:
                  tab === key ? '2px solid #2563eb' : '2px solid transparent',
                marginBottom: '-1px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {label}
              <span
                style={{
                  backgroundColor: tab === key ? '#1e3a8a' : '#374151',
                  color: tab === key ? '#93c5fd' : '#9ca3af',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  borderRadius: '10px',
                }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {visibleBooks.length === 0 && tab === 'read' && (
          <div
            style={{
              textAlign: 'center',
              paddingTop: '60px',
              maxWidth: '320px',
              margin: '0 auto',
            }}
          >
            <p style={{ color: '#9ca3af', fontSize: '15px', margin: '0 0 20px 0' }}>
              No books yet. Add some!
            </p>
            <Link href="/add" style={buttonStyle}>
              Add Books
            </Link>
          </div>
        )}

        {visibleBooks.length === 0 && tab === 'interested' && (
          <div
            style={{
              textAlign: 'center',
              paddingTop: '60px',
              maxWidth: '320px',
              margin: '0 auto',
            }}
          >
            <p
              style={{
                color: '#9ca3af',
                fontSize: '15px',
                lineHeight: 1.6,
                margin: '0 0 20px 0',
              }}
            >
              No books in your pile yet.
              <br />
              Scan your shelf to add books!
            </p>
            <Link href="/shelf" style={buttonStyle}>
              Scan Shelf
            </Link>
          </div>
        )}

        {visibleBooks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visibleBooks.map((book) => (
              <div
                key={book.id}
                style={{
                  backgroundColor: '#111827',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid #374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <BookCover thumbnail={book.thumbnail} title={book.title} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: '700',
                      margin: '0 0 2px 0',
                      lineHeight: 1.3,
                    }}
                  >
                    {book.title}
                  </p>
                  <p
                    style={{
                      color: '#9ca3af',
                      fontSize: '13px',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {book.author || 'Unknown author'}
                  </p>

                  {tab === 'read' && (
                    <StarRating
                      rating={book.rating}
                      onRate={(rating) => handleRate(book.id, rating)}
                    />
                  )}

                  {tab === 'interested' && inlineRatingBookId === book.id && (
                    <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleMarkAsRead(book.id, star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '0 1px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            lineHeight: 1,
                            color: '#4b5563',
                          }}
                          aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '6px',
                }}>
                  {tab === 'read' && deleteConfirmId !== book.id && (
                    <button
                      type="button"
                      onClick={() => handleMoveToInterested(book.id)}
                      style={subtleButtonStyle}
                    >
                      → To Read
                    </button>
                  )}

                  {tab === 'interested' && deleteConfirmId !== book.id && inlineRatingBookId !== book.id && (
                    <button
                      type="button"
                      onClick={() => setInlineRatingBookId(book.id)}
                      style={subtleButtonStyle}
                    >
                      → Mark Read
                    </button>
                  )}

                  {deleteConfirmId === book.id ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '6px',
                      }}
                    >
                      <span
                        style={{ color: '#9ca3af', fontSize: '11px', whiteSpace: 'nowrap' }}
                      >
                        Remove this book?
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(book.id)}
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          style={{
                            backgroundColor: '#374151',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(book.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px',
                        lineHeight: 1,
                      }}
                      aria-label="Delete book"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ApiGuard>
  )
}

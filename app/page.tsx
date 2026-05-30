'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ApiGuard from '@/components/ApiGuard'
import { getBooks } from '@/lib/storage'

export default function Home() {
  const [bookCount, setBookCount] = useState(0)

  useEffect(() => {
    setBookCount(getBooks().length)
  }, [])

  return (
    <ApiGuard>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#030712',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}>
        <Link
          href="/settings"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: '#9ca3af',
            fontSize: '24px',
            textDecoration: 'none',
            lineHeight: 1,
          }}
          aria-label="Settings"
        >
          ⚙️
        </Link>

        <div style={{
          maxWidth: '420px',
          margin: '0 auto',
          paddingTop: '48px',
        }}>
          <h1 style={{
            color: '#ffffff',
            fontSize: '32px',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '0 0 8px 0',
          }}>
            📖 BookMatch
          </h1>

          <p style={{
            color: '#6b7280',
            fontSize: '13px',
            textAlign: 'center',
            margin: '0 0 40px 0',
          }}>
            {bookCount === 0
              ? 'No books in your library yet'
              : `${bookCount} book${bookCount === 1 ? '' : 's'} in your library`}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link
              href="/add"
              style={{
                width: '100%',
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '16px',
                padding: '24px 20px',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                textDecoration: 'none',
                display: 'block',
                boxSizing: 'border-box',
              }}
            >
              Add Books I&apos;ve Read
            </Link>

            <Link
              href="/shelf"
              style={{
                width: '100%',
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '16px',
                padding: '24px 20px',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                textDecoration: 'none',
                display: 'block',
                boxSizing: 'border-box',
              }}
            >
              📸 Scan My Shelf
            </Link>

            <Link
              href="/library"
              style={{
                width: '100%',
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '16px',
                padding: '24px 20px',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                textDecoration: 'none',
                display: 'block',
                boxSizing: 'border-box',
              }}
            >
              My Library
            </Link>

            <Link
              href="/recommend"
              style={{
                width: '100%',
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '16px',
                padding: '24px 20px',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                textDecoration: 'none',
                display: 'block',
                boxSizing: 'border-box',
              }}
            >
              Get Recommendations
            </Link>
          </div>
        </div>
      </div>
    </ApiGuard>
  )
}

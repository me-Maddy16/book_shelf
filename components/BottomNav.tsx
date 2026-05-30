'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', emoji: '🏠', label: 'Home' },
  { href: '/library', emoji: '📚', label: 'Library' },
  { href: '/add', emoji: '➕', label: 'Add' },
  { href: '/shelf', emoji: '📸', label: 'Shelf' },
  { href: '/recommend', emoji: '✨', label: 'For You' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#111827',
        borderTop: '1px solid #1f2937',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {navItems.map(({ href, emoji, label }) => {
        const isActive =
          href === '/'
            ? pathname === '/'
            : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              textDecoration: 'none',
              flex: 1,
              height: '100%',
              color: isActive ? '#3b82f6' : '#6b7280',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }} aria-hidden>
              {emoji}
            </span>
            <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '500' }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveApiKeys, getApiKeys } from '@/lib/storage'

export default function SettingsPage() {
  const router = useRouter()
  const [grokKey, setGrokKey] = useState('')
  const [googleBooksKey, setGoogleBooksKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [keysExist, setKeysExist] = useState(false)

  useEffect(() => {
    const keys = getApiKeys()
    if (keys) {
      setGrokKey(keys.grokKey)
      setGoogleBooksKey(keys.googleBooksKey)
      setGeminiKey(keys.geminiKey ?? '')
      setKeysExist(true)
    }
  }, [])

  const handleSave = () => {
    if (!grokKey.trim() || !googleBooksKey.trim() || !geminiKey.trim()) {
      setError('Please enter all API keys')
      return
    }

    const saved = saveApiKeys({
      grokKey: grokKey.trim(),
      googleBooksKey: googleBooksKey.trim(),
      geminiKey: geminiKey.trim(),
    })

    if (!saved) {
      setError(
        'Could not save keys. Check Safari settings allow website data storage.'
      )
      setSuccess(false)
      return
    }

    setSuccess(true)
    setError('')
    setKeysExist(true)

    setTimeout(() => {
      try {
        router.push('/')
      } catch {
        window.location.href = '/'
        return
      }
      window.setTimeout(() => {
        if (window.location.pathname.includes('/settings')) {
          window.location.href = '/'
        }
      }, 300)
    }, 1500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
          <h1 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Welcome to BookMatch
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            Enter your API keys to get started.<br/>
            Saved only on your device, never on any server.
          </p>
          {keysExist && (
            <div style={{
              marginTop: '12px',
              backgroundColor: '#052e16',
              color: '#4ade80',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              display: 'inline-block'
            }}>
              ✓ Keys are set
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
            Grok API Key
          </label>
          <input
            type="password"
            value={grokKey}
            onChange={e => setGrokKey(e.target.value)}
            placeholder="xai-..."
            style={{
              width: '100%',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '10px',
              padding: '12px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <a href="https://console.x.ai" target="_blank" style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}>
            Get free key at console.x.ai →
          </a>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
            Google Books API Key
          </label>
          <input
            type="password"
            value={googleBooksKey}
            onChange={e => setGoogleBooksKey(e.target.value)}
            placeholder="AIza..."
            style={{
              width: '100%',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '10px',
              padding: '12px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <a href="https://console.cloud.google.com" target="_blank" style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}>
            Get free key at console.cloud.google.com →
          </a>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
            Gemini API Key
          </label>
          <input
            type="password"
            value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            placeholder="AI..."
            style={{
              width: '100%',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '10px',
              padding: '12px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <a href="https://aistudio.google.com" target="_blank" style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}>
            Get free key at aistudio.google.com →
          </a>
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{ color: '#4ade80', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
            ✓ Keys saved! Redirecting...
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          style={{
            width: '100%',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {keysExist ? 'Update Keys' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}

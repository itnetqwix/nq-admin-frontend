import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from 'src/@core/components/icon'
import { getGoogleClientId } from 'src/configs/adminEnv'
import { ops } from 'src/styles/opsSurface'

function loadGis() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  const existing = document.getElementById('google-gsi')
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google script failed')), { once: true })
    })
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = 'google-gsi'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google script failed'))
    document.head.appendChild(script)
  })
}

/**
 * Full-width Google button for invited admins only (no account creation).
 */
export default function AdminGoogleSignIn({ onCredential, disabled }) {
  const clientId = getGoogleClientId()
  const tokenClient = useRef(null)
  const onCredentialRef = useRef(onCredential)
  onCredentialRef.current = onCredential
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  const finish = useCallback(async (payload, errMsg) => {
    setBusy(true)
    try {
      await onCredentialRef.current?.(payload, errMsg)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    void loadGis()
      .then(() => {
        if (cancelled || !window.google?.accounts?.oauth2) return
        tokenClient.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async response => {
            if (response?.error || !response?.access_token) {
              await finish(null, 'Google sign-in was cancelled.')
              return
            }
            try {
              const ui = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` }
              })
              const data = await ui.json()
              const email = String(data?.email || '')
                .trim()
                .toLowerCase()
              if (!email) {
                await finish(null, 'Could not read email from Google.')
                return
              }
              await finish({ email, access_token: response.access_token })
            } catch {
              await finish(null, 'Google sign-in failed.')
            }
          }
        })
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId, finish])

  const onClick = () => {
    if (!clientId) {
      void finish(null, 'Google sign-in is not available on this deployment.')
      return
    }
    if (!tokenClient.current) {
      void finish(null, 'Google sign-in is still loading. Try again in a moment.')
      return
    }
    tokenClient.current.requestAccessToken({ prompt: 'select_account' })
  }

  return (
    <Button
      fullWidth
      size='large'
      variant='outlined'
      disabled={disabled || busy || (Boolean(clientId) && !ready)}
      onClick={onClick}
      startIcon={
        busy ? (
          <CircularProgress size={18} sx={{ color: 'inherit' }} />
        ) : (
          <Icon icon='mdi:google' fontSize={20} />
        )
      }
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        borderColor: ops.hairline,
        color: ops.ink,
        bgcolor: ops.canvas,
        py: 1.15,
        '&:hover': { borderColor: ops.mute, bgcolor: ops.canvasSoft }
      }}
    >
      {busy ? 'Signing in…' : 'Continue with Google'}
    </Button>
  )
}

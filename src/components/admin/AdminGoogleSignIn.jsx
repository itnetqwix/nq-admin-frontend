import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { getGoogleClientId } from 'src/configs/adminEnv'
import { ops } from 'src/styles/opsSurface'

function decodeJwtEmail(credential) {
  try {
    const payload = credential.split('.')[1]
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return String(json?.email || '').trim().toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Google Identity Services button for admin login.
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID (same web client as mobile when possible).
 */
export default function AdminGoogleSignIn({ onCredential, disabled }) {
  const clientId = getGoogleClientId()
  const btnRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [scriptError, setScriptError] = useState('')

  const handleCredential = useCallback(
    async response => {
      const id_token = response?.credential
      if (!id_token) return
      const email = decodeJwtEmail(id_token)
      if (!email) {
        onCredential?.(null, 'Could not read email from Google. Try email/password.')
        return
      }
      setBusy(true)
      try {
        await onCredential?.({ email, id_token })
      } finally {
        setBusy(false)
      }
    },
    [onCredential]
  )

  useEffect(() => {
    if (!clientId || typeof window === 'undefined') return undefined

    let cancelled = false
    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !btnRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true
      })
      btnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(btnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: btnRef.current.offsetWidth || 360
      })
      setReady(true)
    }

    if (window.google?.accounts?.id) {
      init()
      return () => {
        cancelled = true
      }
    }

    const existing = document.getElementById('google-gsi')
    if (existing) {
      existing.addEventListener('load', init)
      return () => {
        cancelled = true
        existing.removeEventListener('load', init)
      }
    }

    const script = document.createElement('script')
    script.id = 'google-gsi'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = init
    script.onerror = () => setScriptError('Google sign-in script failed to load.')
    document.head.appendChild(script)
    return () => {
      cancelled = true
    }
  }, [clientId, handleCredential])

  if (!clientId) {
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: ops.radiusSm,
          border: `1px dashed ${ops.hairline}`,
          bgcolor: ops.canvasSoft
        }}
      >
        <Typography sx={{ fontSize: 12, color: ops.mute, lineHeight: 1.5 }}>
          Google sign-in needs <Box component='code' sx={{ fontFamily: ops.mono }}>NEXT_PUBLIC_GOOGLE_CLIENT_ID</Box> in
          admin env.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', opacity: disabled || busy ? 0.6 : 1, pointerEvents: disabled || busy ? 'none' : 'auto' }}>
      <Box ref={btnRef} sx={{ minHeight: 44, display: 'flex', justifyContent: 'center', '& > div': { width: '100% !important' } }} />
      {!ready && !scriptError ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 1.5 }}>
          <CircularProgress size={16} />
          <Typography sx={{ fontSize: 12, color: ops.mute }}>Loading Google…</Typography>
        </Box>
      ) : null}
      {scriptError ? (
        <Button
          fullWidth
          variant='outlined'
          startIcon={<Icon icon='mdi:google' />}
          disabled
          sx={{ textTransform: 'none', borderColor: ops.hairline, color: ops.mute }}
        >
          {scriptError}
        </Button>
      ) : null}
    </Box>
  )
}

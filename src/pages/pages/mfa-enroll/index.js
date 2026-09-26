import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { useAuth } from 'src/hooks/useAuth'
import authConfig from 'src/configs/auth'
import toast from 'react-hot-toast'
import { OpsAuthShell } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

const api = process.env.NEXT_PUBLIC_API_BASE_URL

const MfaEnrollPage = () => {
  const auth = useAuth()
  const router = useRouter()
  const [secret, setSecret] = useState('')
  const [otpauthUrl, setOtpauthUrl] = useState('')
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [setupError, setSetupError] = useState('')

  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem(authConfig.storageTokenKeyName) : null

  useEffect(() => {
    if (!auth.bootstrapped) return
    if (!token) {
      void router.replace('/login')
      return
    }
    setBusy(true)
    setSetupError('')
    fetch(`${api}/user/2fa/totp/setup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(body => {
        const data = body?.data ?? body?.result?.data ?? body?.result
        if (!data?.secret) throw new Error(body?.error || body?.msg || 'Setup failed')
        setSecret(data.secret)
        setOtpauthUrl(data.otpauthUrl || data.otpauth_url || '')
      })
      .catch(e => {
        const msg = e.message || 'Could not start MFA setup'
        setSetupError(msg)
        toast.error(msg)
      })
      .finally(() => setBusy(false))
  }, [token, router, auth.bootstrapped])

  const confirm = e => {
    e.preventDefault()
    if (!token) return
    setBusy(true)
    fetch(`${api}/user/2fa/totp/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: code.trim() })
    })
      .then(r => r.json())
      .then(body => {
        if (body?.status === 'fail' || body?.status === 'FAIL') {
          throw new Error(body?.error || 'Invalid code')
        }
        const data = body?.data ?? body?.result?.data ?? body?.result
        setRecoveryCodes(data?.recoveryCodes || data?.recovery_codes || [])
        auth.clearMfaEnrollment?.()
        toast.success('MFA enabled')
      })
      .catch(err => toast.error(err.message || 'Confirm failed'))
      .finally(() => setBusy(false))
  }

  return (
    <OpsAuthShell
      eyebrow='Security'
      title='Enable authenticator MFA'
      subtitle='Required only for the main SuperAdmin. Scan the QR or enter the secret, then confirm with a code.'
    >
      {recoveryCodes ? (
        <Box>
          <Alert
            severity='success'
            sx={{
              mb: 2,
              borderRadius: '10px',
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#A7F3D0',
              '& .MuiAlert-icon': { color: '#34D399' }
            }}
          >
            Store these recovery codes offline. They are shown once.
          </Alert>
          <Box
            component='ul'
            sx={{
              fontFamily: ops.mono,
              fontSize: 13,
              pl: 2.5,
              mb: 2.5,
              color: '#E2E8F0',
              bgcolor: 'rgba(11, 15, 23, 0.5)',
              p: 2,
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {(recoveryCodes.length ? recoveryCodes : ['(none returned)']).map(c => (
              <li key={c}>{c}</li>
            ))}
          </Box>
          <Button
            fullWidth
            size='large'
            variant='contained'
            onClick={() => {
              auth.clearMfaEnrollment?.()
              void router.replace('/home')
            }}
            sx={{
              height: 48,
              background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '12px',
              textTransform: 'none',
              boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                boxShadow: '0 6px 20px 0 rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-1px)'
              },
              '&:active': { transform: 'translateY(0px)' }
            }}
          >
            Continue to admin
          </Button>
        </Box>
      ) : (
        <form onSubmit={confirm}>
          {setupError ? (
            <Alert
              severity='error'
              sx={{
                mb: 2,
                borderRadius: '10px',
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#FCA5A5',
                '& .MuiAlert-icon': { color: '#F87171' }
              }}
            >
              {setupError}
            </Alert>
          ) : null}
          {otpauthUrl ? (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'inline-block',
                  p: 1.5,
                  bgcolor: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.4)'
                }}
              >
                <Box
                  component='img'
                  alt='Authenticator QR'
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUrl)}`}
                  sx={{ width: 180, height: 180, display: 'block', borderRadius: '4px' }}
                />
              </Box>
            </Box>
          ) : null}
          {secret ? (
            <Typography sx={{ mb: 2, fontFamily: ops.mono, fontSize: 12, color: '#A5B4FC', wordBreak: 'break-all', textAlign: 'center' }}>
              Secret: {secret}
            </Typography>
          ) : null}
          {busy && !secret && !setupError ? (
            <Typography sx={{ mb: 2, color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>Starting authenticator setup…</Typography>
          ) : null}
          <TextField
            fullWidth
            value={code}
            onChange={e => setCode(e.target.value.replace(/\s/g, ''))}
            placeholder='123456'
            inputProps={{ autoComplete: 'one-time-code', inputMode: 'numeric' }}
            sx={{
              mb: 2.5,
              bgcolor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '12px',
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '12px',
                color: '#F8FAFC',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': { borderColor: 'rgba(51, 65, 85, 0.6)', borderWidth: '1px' },
                '&:hover fieldset': { borderColor: 'rgba(71, 85, 105, 0.85)' },
                '&.Mui-focused fieldset': {
                  borderColor: '#6366F1',
                  borderWidth: '2px',
                  boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)'
                },
                '&.Mui-error fieldset': {
                  borderColor: 'rgba(244, 63, 94, 0.85) !important'
                }
              },
              '& input': {
                textAlign: 'center',
                letterSpacing: '0.42em',
                fontFamily: ops.mono,
                fontSize: 22,
                fontWeight: 700,
                py: 1.75,
                color: '#FFFFFF',
                caretColor: '#6366F1',
                '&::placeholder': {
                  color: '#64748B',
                  opacity: '1 !important',
                  WebkitTextFillColor: '#64748B'
                }
              }
            }}
          />
          <Button
            fullWidth
            size='large'
            type='submit'
            variant='contained'
            disabled={busy || code.trim().length < 6 || !secret}
            sx={{
              height: 48,
              mb: 1.5,
              background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '12px',
              textTransform: 'none',
              boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                boxShadow: '0 6px 20px 0 rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-1px)'
              },
              '&:active': { transform: 'translateY(0px)' },
              '&.Mui-disabled': { background: 'rgba(255, 255, 255, 0.08)', color: 'rgba(255, 255, 255, 0.35)', boxShadow: 'none' }
            }}
          >
            {busy ? 'Working…' : 'Confirm and enable'}
          </Button>
        </form>
      )}
      <Button
        fullWidth
        size='large'
        variant='outlined'
        onClick={() => auth.logout?.()}
        sx={{
          height: 46,
          mt: 1,
          textTransform: 'none',
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          color: '#F1F5F9',
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.25)',
            bgcolor: 'rgba(255, 255, 255, 0.09)',
            color: '#FFFFFF',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.35)'
          },
          '&:active': { transform: 'translateY(0)' }
        }}
      >
        Sign out
      </Button>
    </OpsAuthShell>
  )
}

MfaEnrollPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
MfaEnrollPage.authGuard = true

export default MfaEnrollPage

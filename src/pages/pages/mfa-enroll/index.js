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
          <Alert severity='success' sx={{ mb: 2, borderRadius: ops.radiusSm }}>
            Store these recovery codes offline. They are shown once.
          </Alert>
          <Box
            component='ul'
            sx={{ fontFamily: ops.mono, fontSize: 13, pl: 2.5, mb: 2.5, color: ops.ink }}
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
            sx={{ bgcolor: ops.ink, '&:hover': { bgcolor: '#000' }, textTransform: 'none', fontWeight: 600 }}
          >
            Continue to admin
          </Button>
        </Box>
      ) : (
        <form onSubmit={confirm}>
          {setupError ? (
            <Alert severity='error' sx={{ mb: 2, borderRadius: ops.radiusSm }}>
              {setupError}
            </Alert>
          ) : null}
          {otpauthUrl ? (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              {/* ponytail: public QR endpoint, no extra npm */}
              <Box
                component='img'
                alt='Authenticator QR'
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUrl)}`}
                sx={{ width: 180, height: 180, borderRadius: 1, border: `1px solid ${ops.hairline}` }}
              />
            </Box>
          ) : null}
          {secret ? (
            <Typography sx={{ mb: 2, fontFamily: ops.mono, fontSize: 12, color: ops.body, wordBreak: 'break-all' }}>
              Secret: {secret}
            </Typography>
          ) : null}
          {busy && !secret && !setupError ? (
            <Typography sx={{ mb: 2, color: ops.mute, fontSize: 13 }}>Starting authenticator setup…</Typography>
          ) : null}
          <TextField
            fullWidth
            value={code}
            onChange={e => setCode(e.target.value.replace(/\s/g, ''))}
            placeholder='123456'
            inputProps={{ autoComplete: 'one-time-code', inputMode: 'numeric' }}
            sx={{
              mb: 2.5,
              '& input': {
                textAlign: 'center',
                letterSpacing: '0.42em',
                fontFamily: ops.mono,
                fontSize: 22,
                fontWeight: 700,
                py: 1.75
              }
            }}
          />
          <Button
            fullWidth
            size='large'
            type='submit'
            variant='contained'
            disabled={busy || code.trim().length < 6 || !secret}
            sx={{ mb: 1.5, bgcolor: ops.ink, '&:hover': { bgcolor: '#000' }, textTransform: 'none', fontWeight: 600 }}
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
        sx={{ mt: 1, textTransform: 'none', borderColor: ops.hairline, color: ops.ink }}
      >
        Sign out
      </Button>
    </OpsAuthShell>
  )
}

MfaEnrollPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
MfaEnrollPage.authGuard = true

export default MfaEnrollPage

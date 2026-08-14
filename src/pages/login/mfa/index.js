import { useState } from 'react'
import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { useAuth } from 'src/hooks/useAuth'
import toast from 'react-hot-toast'
import { OpsAuthShell } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

const MfaChallengePage = () => {
  const auth = useAuth()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = (value = code) => {
    const trimmed = String(value || '').trim()
    if (busy || trimmed.length < 6) return
    setBusy(true)
    auth.completeTwoFactor(trimmed, err => {
      setBusy(false)
      toast.error(err || 'Invalid code')
    })
  }

  return (
    <OpsAuthShell
      eyebrow='Verification'
      title='Authenticator code'
      subtitle='Enter the 6-digit code from your authenticator app, or a recovery code.'
    >
      <form
        onSubmit={e => {
          e.preventDefault()
          submit()
        }}
      >
        <TextField
          autoFocus
          fullWidth
          value={code}
          onChange={e => {
            const next = e.target.value.replace(/\s/g, '')
            setCode(next)
            if (/^\d{6}$/.test(next)) submit(next)
          }}
          placeholder='123456'
          inputProps={{
            autoComplete: 'one-time-code',
            inputMode: 'numeric',
            'aria-label': 'Authenticator code'
          }}
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
          disabled={busy || code.trim().length < 6}
          sx={{ mb: 1.5, bgcolor: ops.ink, '&:hover': { bgcolor: '#000' }, textTransform: 'none', fontWeight: 600 }}
        >
          {busy ? 'Verifying…' : 'Verify'}
        </Button>
        <Button
          fullWidth
          size='large'
          variant='outlined'
          onClick={() => {
            auth.logout()
            router.push('/login')
          }}
          sx={{ textTransform: 'none', borderColor: ops.hairline, color: ops.ink }}
        >
          Back to login
        </Button>
        <Typography sx={{ mt: 2, fontSize: 12, color: ops.mute, lineHeight: 1.55 }}>
          Only the main SuperAdmin is required to complete this step. Sub-admins sign in with email
          and password only.
        </Typography>
      </form>
    </OpsAuthShell>
  )
}

MfaChallengePage.getLayout = page => <BlankLayout>{page}</BlankLayout>
MfaChallengePage.guestGuard = true

export default MfaChallengePage

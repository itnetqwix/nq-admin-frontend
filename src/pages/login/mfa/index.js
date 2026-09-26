import { useState } from 'react'
import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
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
            'aria-label': 'Authenticator or recovery code'
          }}
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
          disabled={busy || code.trim().length < 6}
          startIcon={busy ? <CircularProgress size={18} sx={{ color: '#FFFFFF' }} /> : null}
          sx={{
            height: 48,
            mb: 1.5,
            background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            borderRadius: '12px',
            textTransform: 'none',
            boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
              boxShadow: '0 6px 20px 0 rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              transform: 'translateY(-1px)'
            },
            '&:active': { transform: 'translateY(0px)', boxShadow: '0 2px 8px 0 rgba(99, 102, 241, 0.4)' },
            '&.Mui-disabled': { background: 'rgba(255, 255, 255, 0.08)', color: 'rgba(255, 255, 255, 0.35)', boxShadow: 'none' }
          }}
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
          sx={{
            height: 46,
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
          Back to login
        </Button>
        <Typography sx={{ mt: 2, fontSize: 12.5, color: '#94A3B8', lineHeight: 1.55 }}>
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

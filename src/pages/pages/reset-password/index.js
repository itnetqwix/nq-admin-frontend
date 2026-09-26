import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from 'src/@core/components/icon'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import toast from 'react-hot-toast'
import { OpsAuthShell } from 'src/components/admin'

const fieldSx = {
  bgcolor: 'rgba(15, 23, 42, 0.8)',
  borderRadius: '12px',
  '& .MuiInputLabel-root': {
    color: '#94A3B8',
    fontSize: '14px',
    '&.Mui-focused': {
      color: '#818CF8'
    },
    '&.Mui-error': {
      color: '#F43F5E'
    }
  },
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '12px',
    color: '#F8FAFC',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '& fieldset': {
      borderColor: 'rgba(51, 65, 85, 0.6)',
      borderWidth: '1px'
    },
    '&:hover fieldset': {
      borderColor: 'rgba(71, 85, 105, 0.85)'
    },
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
    fontSize: '14px',
    lineHeight: '20px',
    py: 1.5,
    px: 2,
    color: '#F8FAFC',
    caretColor: '#6366F1',
    '&::placeholder': {
      color: '#64748B',
      opacity: '1 !important',
      WebkitTextFillColor: '#64748B'
    },
    '&::-webkit-input-placeholder': {
      color: '#64748B',
      opacity: '1 !important',
      WebkitTextFillColor: '#64748B'
    },
    '&::-moz-placeholder': {
      color: '#64748B',
      opacity: '1 !important'
    },
    '&:-ms-input-placeholder': {
      color: '#64748B',
      opacity: '1 !important'
    }
  },
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
    WebkitBoxShadow: '0 0 0 1000px #0F172A inset !important',
    WebkitTextFillColor: '#F8FAFC !important',
    caretColor: '#6366F1 !important',
    transition: 'background-color 9999s ease-out 0s'
  }
}

const ResetPassword = () => {
  const router = useRouter()
  const token = typeof router.query.token === 'string' ? router.query.token : ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  return (
    <OpsAuthShell
      eyebrow='Invite'
      title='Set your password'
      subtitle='Use this link from your admin invite email, then sign in to the NetQwix admin panel.'
    >
      <form
        noValidate
        onSubmit={async e => {
          e.preventDefault()
          if (!token) {
            toast.error('This invite link is missing a token.')
            return
          }
          if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
          }
          if (password !== confirm) {
            toast.error('Passwords do not match')
            return
          }
          setSubmitting(true)
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/confirm-reset-password`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, password })
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || String(data?.status).toLowerCase() === 'fail') {
              throw new Error(data?.error || data?.message || 'Reset failed')
            }
            toast.success('Password saved. Sign in to continue.')
            void router.replace('/login')
          } catch (err) {
            toast.error(err?.message || 'Unable to set password')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        <TextField
          autoFocus
          fullWidth
          type={show ? 'text' : 'password'}
          label='New password'
          placeholder='••••••••••••'
          value={password}
          onChange={e => setPassword(e.target.value)}
          sx={{ ...fieldSx, mb: 2.5 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton
                  edge='end'
                  size='small'
                  onClick={() => setShow(v => !v)}
                  sx={{ color: '#64748B', '&:hover': { color: '#F1F5F9', bgcolor: 'rgba(255, 255, 255, 0.08)' } }}
                >
                  <Icon icon={show ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} fontSize={20} />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <TextField
          fullWidth
          type={show ? 'text' : 'password'}
          label='Confirm password'
          placeholder='••••••••••••'
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          sx={{ ...fieldSx, mb: 3 }}
        />
        <Button
          fullWidth
          size='large'
          type='submit'
          variant='contained'
          disabled={submitting || !token}
          startIcon={submitting ? <CircularProgress size={18} sx={{ color: '#FFFFFF' }} /> : null}
          sx={{
            height: 48,
            mb: 2.5,
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
            '&:active': {
              transform: 'translateY(0px)',
              boxShadow: '0 2px 8px 0 rgba(99, 102, 241, 0.4)'
            },
            '&.Mui-disabled': {
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.35)',
              boxShadow: 'none'
            }
          }}
        >
          {submitting ? 'Saving…' : 'Save password'}
        </Button>
        <Typography
          component={Link}
          href='/login'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            color: '#818CF8',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            transition: 'color 0.15s ease',
            '&:hover': { color: '#A5B4FC', textDecoration: 'underline' }
          }}
        >
          <Icon icon='mdi:chevron-left' fontSize={20} />
          Back to login
        </Typography>
      </form>
    </OpsAuthShell>
  )
}

ResetPassword.guestGuard = true
ResetPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ResetPassword

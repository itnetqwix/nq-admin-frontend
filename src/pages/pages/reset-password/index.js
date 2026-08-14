import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import toast from 'react-hot-toast'
import { OpsAuthShell } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

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
          value={password}
          onChange={e => setPassword(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton edge='end' onClick={() => setShow(v => !v)}>
                  <Icon icon={show ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <TextField
          fullWidth
          type={show ? 'text' : 'password'}
          label='Confirm password'
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Button
          fullWidth
          size='large'
          type='submit'
          variant='contained'
          disabled={submitting || !token}
          sx={{ mb: 2.5, bgcolor: ops.ink, '&:hover': { bgcolor: '#000' }, textTransform: 'none', fontWeight: 600 }}
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
            color: ops.link,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          Back to login
        </Typography>
      </form>
    </OpsAuthShell>
  )
}

ResetPassword.guestGuard = true
ResetPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ResetPassword

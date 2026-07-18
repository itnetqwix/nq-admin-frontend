import { useState } from 'react'
import Link from 'next/link'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import toast from 'react-hot-toast'
import { OpsAuthShell } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <OpsAuthShell
      eyebrow='Recovery'
      title='Reset password'
      subtitle='Only Admin accounts receive a reset link. Enter the email on your admin profile.'
    >
      <form
        noValidate
        autoComplete='off'
        onSubmit={async e => {
          e.preventDefault()
          const em = email.trim()
          if (!em) {
            toast.error('Email is required')
            return
          }
          setSubmitting(true)
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/forgot-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: em, portal: 'admin' })
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || String(data?.status).toLowerCase() === 'fail') {
              throw new Error(data?.error || data?.message || 'Request failed')
            }
            toast.success(data?.msg || data?.result?.message || 'Check your email for reset instructions.')
          } catch (err) {
            toast.error(err?.message || 'Unable to send reset email')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        <TextField
          autoFocus
          fullWidth
          type='email'
          label='Email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          sx={{ mb: 3 }}
          placeholder='admin@company.com'
        />
        <Button
          fullWidth
          size='large'
          type='submit'
          variant='contained'
          disabled={submitting}
          sx={{ mb: 2.5, bgcolor: ops.ink, '&:hover': { bgcolor: '#000' }, textTransform: 'none', fontWeight: 600 }}
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </Button>
        <Typography
          component={Link}
          href='/login'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            color: ops.link,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          <Icon icon='mdi:chevron-left' fontSize={20} />
          Back to login
        </Typography>
      </form>
    </OpsAuthShell>
  )
}

ForgotPassword.guestGuard = true
ForgotPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ForgotPassword

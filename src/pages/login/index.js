import { useState, useEffect } from 'react'
import Link from 'next/link'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import OutlinedInput from '@mui/material/OutlinedInput'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from 'src/@core/components/icon'
import { showAdminMfaNotice } from 'src/configs/adminEnv'
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useAuth } from 'src/hooks/useAuth'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { OpsAuthShell } from 'src/components/admin'
import AdminGoogleSignIn from 'src/components/admin/AdminGoogleSignIn'
import { ops } from 'src/styles/opsSurface'
import { isRememberMeEnabled } from 'src/utils/authStorage'

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(5).required()
})

const defaultValues = { password: '', email: '' }

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

const LoginPage = () => {
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [googleError, setGoogleError] = useState('')
  const auth = useAuth()

  useEffect(() => {
    setRememberMe(isRememberMeEnabled())
  }, [])

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(schema)
  })

  const onSubmit = data => {
    setFormError('')
    auth.login({ email: data.email, password: data.password, rememberMe }, err => {
      setFormError(err ?? 'Email or password is invalid')
    })
  }

  const onGoogle = async (payload, errMsg) => {
    setGoogleError('')
    if (errMsg) {
      setGoogleError(errMsg)
      return
    }
    if (!payload) return
    await auth.loginWithGoogle({ ...payload, rememberMe }, err => setGoogleError(err || 'Google sign-in failed'))
  }

  return (
    <OpsAuthShell
      eyebrow='Sign in'
      title='Administrator login'
      subtitle='Continue with Google or your invited admin email. Access is granted by a Super Admin — you cannot create an account here.'
    >
      <AdminGoogleSignIn onCredential={onGoogle} disabled={auth.loading} />
      {googleError ? (
        <Alert
          severity='error'
          sx={{
            mt: 2,
            borderRadius: '10px',
            bgcolor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#FCA5A5',
            fontSize: 13,
            '& .MuiAlert-icon': { color: '#F87171' }
          }}
        >
          {googleError}
        </Alert>
      ) : null}

      <Divider sx={{ my: 2.5, '&::before, &::after': { borderColor: 'rgba(255, 255, 255, 0.08)' } }}>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', px: 1.5 }}>
          or email
        </Typography>
      </Divider>

      <form noValidate autoComplete='on' onSubmit={handleSubmit(onSubmit)}>
        {formError ? (
          <Alert
            severity='error'
            sx={{
              mb: 2.5,
              borderRadius: '10px',
              bgcolor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#FCA5A5',
              fontSize: 13,
              '& .MuiAlert-icon': { color: '#F87171' }
            }}
          >
            {formError}
          </Alert>
        ) : null}

        <FormControl fullWidth sx={{ mb: 2.5 }}>
          <Controller
            name='email'
            control={control}
            rules={{ required: true }}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label='Email'
                value={value}
                onBlur={onBlur}
                onChange={onChange}
                error={Boolean(errors.email)}
                placeholder='admin@netqwix.com'
                autoComplete='username'
                sx={fieldSx}
              />
            )}
          />
          {errors.email ? (
            <FormHelperText sx={{ color: '#F43F5E', mx: 0.5, mt: 0.5 }}>{errors.email.message}</FormHelperText>
          ) : null}
        </FormControl>

        <FormControl fullWidth sx={{ mb: 1 }}>
          <InputLabel htmlFor='auth-login-password' error={Boolean(errors.password)}>
            Password
          </InputLabel>
          <Controller
            name='password'
            control={control}
            rules={{ required: true }}
            render={({ field: { value, onChange, onBlur } }) => (
              <OutlinedInput
                value={value}
                onBlur={onBlur}
                label='Password'
                placeholder='••••••••••••'
                onChange={onChange}
                id='auth-login-password'
                error={Boolean(errors.password)}
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                sx={fieldSx}
                endAdornment={
                  <InputAdornment position='end'>
                    <IconButton
                      edge='end'
                      size='small'
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setShowPassword(v => !v)}
                      sx={{ color: '#64748B', '&:hover': { color: '#F1F5F9', bgcolor: 'rgba(255, 255, 255, 0.08)' } }}
                    >
                      <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
                    </IconButton>
                  </InputAdornment>
                }
              />
            )}
          />
          {errors.password ? (
            <FormHelperText sx={{ color: '#F43F5E', mx: 0.5, mt: 0.5 }}>{errors.password.message}</FormHelperText>
          ) : null}
        </FormControl>

        <Box sx={{ my: 2.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1 }}>
          <FormControlLabel
            label='Remember me (2 weeks)'
            control={
              <Checkbox
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                size='small'
                sx={{
                  color: 'rgba(255, 255, 255, 0.25)',
                  '&.Mui-checked': { color: '#6366F1' }
                }}
              />
            }
            sx={{ '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 500, color: '#94A3B8', userSelect: 'none' } }}
          />
          <Typography
            variant='body2'
            component={Link}
            href='/forgot-password'
            sx={{
              color: '#818CF8',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              transition: 'color 0.15s ease',
              '&:hover': { color: '#A5B4FC', textDecoration: 'underline' }
            }}
          >
            Forgot password?
          </Typography>
        </Box>

        <Button
          fullWidth
          size='large'
          type='submit'
          variant='contained'
          disabled={auth.loading}
          startIcon={auth.loading ? <CircularProgress size={18} sx={{ color: '#FFFFFF' }} /> : null}
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
          {auth.loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.25,
            p: 1.75,
            borderRadius: '12px',
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            mb: 2
          }}
        >
          <Box sx={{ color: '#818CF8', mt: 0.2, flexShrink: 0, display: 'flex' }}>
            <Icon icon='mdi:information-outline' fontSize={18} />
          </Box>
          <Typography sx={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.55 }}>
            Need access? Ask a Super Admin to invite this email from Roles. Google works on the same
            invited address — including trainers or trainees who were granted panel access.
          </Typography>
        </Box>

        {showAdminMfaNotice() ? (
          <Alert
            severity='info'
            sx={{
              borderRadius: '10px',
              bgcolor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#C7D2FE',
              fontSize: 12.5,
              lineHeight: 1.5,
              '& .MuiAlert-icon': { color: '#818CF8' }
            }}
          >
            Your organization requires authenticator MFA for the main SuperAdmin only. Invited
            sub-admins sign in with email and password or Google.
          </Alert>
        ) : null}
      </form>
    </OpsAuthShell>
  )
}

LoginPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
LoginPage.guestGuard = true

export default LoginPage

import { useState } from 'react'
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

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(5).required()
})

const defaultValues = { password: '', email: '' }

const LoginPage = () => {
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const auth = useAuth()

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(schema)
  })

  const onSubmit = data => {
    const { email, password } = data
    auth.login({ email, password, rememberMe }, err => {
      setError('email', {
        type: 'manual',
        message: err ?? 'Email or Password is invalid'
      })
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
      subtitle='Use your NetQwix admin email, or continue with Google if your account is already provisioned.'
    >
      <AdminGoogleSignIn onCredential={onGoogle} disabled={auth.loading} />
      {googleError ? (
        <Alert severity='error' sx={{ mt: 1.5, borderRadius: ops.radiusSm, mb: 0 }}>
          {googleError}
        </Alert>
      ) : null}

      <Divider sx={{ my: 2.5 }}>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>or email</Typography>
      </Divider>

      <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <Controller
            name='email'
            control={control}
            rules={{ required: true }}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                autoFocus
                label='Email'
                value={value}
                onBlur={onBlur}
                onChange={onChange}
                error={Boolean(errors.email)}
                placeholder='admin@netqwix.com'
              />
            )}
          />
          {errors.email ? <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText> : null}
        </FormControl>
        <FormControl fullWidth>
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
                onChange={onChange}
                id='auth-login-password'
                error={Boolean(errors.password)}
                type={showPassword ? 'text' : 'password'}
                endAdornment={
                  <InputAdornment position='end'>
                    <IconButton edge='end' onMouseDown={e => e.preventDefault()} onClick={() => setShowPassword(v => !v)}>
                      <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
                    </IconButton>
                  </InputAdornment>
                }
              />
            )}
          />
          {errors.password ? (
            <FormHelperText sx={{ color: 'error.main' }}>{errors.password.message}</FormHelperText>
          ) : null}
        </FormControl>
        <Box sx={{ my: 2.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <FormControlLabel
            label='Remember me (2 weeks)'
            control={<Checkbox checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} size='small' />}
            sx={{ '& .MuiFormControlLabel-label': { fontSize: 13, color: ops.body } }}
          />
          <Typography
            variant='body2'
            component={Link}
            href='/forgot-password'
            sx={{ color: ops.link, textDecoration: 'none', fontSize: 13 }}
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
          sx={{ mb: 1.5, bgcolor: ops.ink, '&:hover': { bgcolor: '#000' }, textTransform: 'none', fontWeight: 600 }}
        >
          Sign in
        </Button>
        <Button
          fullWidth
          size='large'
          variant='outlined'
          component={Link}
          href='/register'
          sx={{ mb: 2, textTransform: 'none', borderColor: ops.hairline, color: ops.ink }}
        >
          Create administrator account
        </Button>
        <Typography sx={{ fontSize: 12, color: ops.mute, lineHeight: 1.55, mb: 2 }}>
          Only existing Admin accounts can sign in. Google works when that email is already an admin on NetQwix.
        </Typography>
        {showAdminMfaNotice() ? (
          <Alert severity='info' sx={{ borderRadius: ops.radiusSm }}>
            Your organization may enable multi-factor authentication for admin accounts.
          </Alert>
        ) : null}
      </form>
    </OpsAuthShell>
  )
}

LoginPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
LoginPage.guestGuard = true

export default LoginPage

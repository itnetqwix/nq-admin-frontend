import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Icon from 'src/@core/components/icon'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import toast from 'react-hot-toast'
import { adminRegisterEnvHint, isAdminRegisterEnabled } from 'src/configs/adminEnv'
import { registerAdminAccount } from 'src/services/adminAuthApi'
import { OpsAuthShell } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formValues, setFormValues] = useState({
    fullname: '',
    email: '',
    mobile_no: '',
    password: ''
  })
  const router = useRouter()
  const registerEnabled = isAdminRegisterEnabled()

  const handleInputChange = event => {
    const { name, value } = event.target
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async event => {
    event.preventDefault()
    setErrorMessage('')

    if (!formValues.fullname?.trim() || !formValues.email?.trim() || !formValues.mobile_no?.trim() || !formValues.password) {
      setErrorMessage('All fields are required.')
      return
    }
    if (!acceptedTerms) {
      setErrorMessage('Please accept the privacy policy and terms to continue.')
      return
    }

    const password = formValues.password
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.')
      return
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setErrorMessage('Password must include upper and lower case letters and a special character.')
      return
    }

    setIsSubmitting(true)
    try {
      await registerAdminAccount({
        fullname: formValues.fullname,
        email: formValues.email,
        mobile_no: formValues.mobile_no,
        password: formValues.password,
        accepted_terms_and_privacy: true
      })
      toast.success('Administrator account created. Sign in with your email and password.')
      router.push('/login')
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to create admin account right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <OpsAuthShell
      eyebrow='Bootstrap'
      title='Create administrator'
      subtitle='Registers an Admin account. Use only for trusted bootstrap or internal onboarding.'
    >
      {!registerEnabled ? (
        <Alert severity='warning' sx={{ mb: 3, borderRadius: ops.radiusSm }}>
          {adminRegisterEnvHint()} Restart the dev server after updating env.
        </Alert>
      ) : null}
      <form noValidate autoComplete='off' onSubmit={handleRegister}>
        <TextField
          autoFocus
          fullWidth
          sx={{ mb: 3 }}
          label='Full name'
          name='fullname'
          value={formValues.fullname}
          onChange={handleInputChange}
          placeholder='Jane Admin'
        />
        <TextField
          fullWidth
          label='Email'
          name='email'
          value={formValues.email}
          onChange={handleInputChange}
          sx={{ mb: 3 }}
          placeholder='admin@company.com'
        />
        <TextField
          fullWidth
          label='Mobile number'
          name='mobile_no'
          value={formValues.mobile_no}
          onChange={handleInputChange}
          sx={{ mb: 3 }}
          placeholder='+1 555 123 4567'
        />
        <FormControl fullWidth>
          <InputLabel htmlFor='auth-register-password'>Password</InputLabel>
          <OutlinedInput
            label='Password'
            id='auth-register-password'
            name='password'
            value={formValues.password}
            onChange={handleInputChange}
            type={showPassword ? 'text' : 'password'}
            endAdornment={
              <InputAdornment position='end'>
                <IconButton edge='end' onMouseDown={e => e.preventDefault()} onClick={() => setShowPassword(v => !v)}>
                  <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} />
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
        <Typography variant='caption' sx={{ display: 'block', color: ops.mute, mt: 1 }}>
          At least 8 characters with upper, lower, and special characters.
        </Typography>
        {errorMessage ? (
          <Typography color='error' variant='body2' sx={{ mt: 2 }}>
            {errorMessage}
          </Typography>
        ) : null}
        <FormControlLabel
          control={<Checkbox checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} size='small' />}
          sx={{ mb: 2.5, mt: 1.5, '& .MuiFormControlLabel-label': { fontSize: 13, color: ops.body } }}
          label={
            <Typography variant='body2' component='span' sx={{ fontSize: 13 }}>
              I agree to privacy policy & terms
            </Typography>
          }
        />
        <Button
          fullWidth
          size='large'
          type='submit'
          variant='contained'
          disabled={isSubmitting || !acceptedTerms}
          sx={{ mb: 2.5, bgcolor: ops.ink, '&:hover': { bgcolor: '#000' }, textTransform: 'none', fontWeight: 600 }}
        >
          {isSubmitting ? 'Creating…' : 'Create admin account'}
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography sx={{ color: ops.mute, fontSize: 13 }}>Already have an account?</Typography>
          <Typography
            href='/login'
            component={Link}
            sx={{ color: ops.link, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
          >
            Sign in
          </Typography>
        </Box>
      </form>
    </OpsAuthShell>
  )
}

Register.getLayout = page => <BlankLayout>{page}</BlankLayout>
Register.guestGuard = true

export default Register

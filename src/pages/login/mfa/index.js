import { useState } from 'react'
import { useRouter } from 'next/router'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { useAuth } from 'src/hooks/useAuth'
import toast from 'react-hot-toast'

const MfaChallengePage = () => {
  const auth = useAuth()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = e => {
    e.preventDefault()
    setBusy(true)
    auth.completeTwoFactor(code.trim(), err => {
      setBusy(false)
      toast.error(err || 'Invalid code')
    })
  }

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin verification</h1>
      <p style={{ marginTop: 8, color: '#555' }}>
        Enter the 6-digit code from your authenticator app (or a recovery code).
      </p>
      <form onSubmit={submit} style={{ marginTop: 24 }}>
        <input
          autoFocus
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="123456"
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #ccc',
            borderRadius: 8,
            fontSize: 16
          }}
        />
        <button
          type="submit"
          disabled={busy || code.trim().length < 6}
          style={{
            marginTop: 16,
            width: '100%',
            padding: 12,
            background: '#000080',
            color: '#fff',
            border: 0,
            borderRadius: 8,
            fontWeight: 600,
            opacity: busy ? 0.6 : 1
          }}
        >
          {busy ? 'Verifying…' : 'Verify'}
        </button>
        <button
          type="button"
          onClick={() => {
            auth.logout()
            router.push('/login')
          }}
          style={{
            marginTop: 12,
            width: '100%',
            padding: 10,
            background: 'transparent',
            border: '1px solid #ddd',
            borderRadius: 8
          }}
        >
          Back to login
        </button>
      </form>
    </div>
  )
}

MfaChallengePage.getLayout = page => <BlankLayout>{page}</BlankLayout>
MfaChallengePage.guestGuard = true

export default MfaChallengePage

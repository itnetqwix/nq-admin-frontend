import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { useAuth } from 'src/hooks/useAuth'
import authConfig from 'src/configs/auth'
import toast from 'react-hot-toast'

const api = process.env.NEXT_PUBLIC_API_BASE_URL

const MfaEnrollPage = () => {
  const auth = useAuth()
  const router = useRouter()
  const [secret, setSecret] = useState('')
  const [otpauthUrl, setOtpauthUrl] = useState('')
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState(null)
  const [busy, setBusy] = useState(false)

  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(authConfig.storageTokenKeyName)
      : null

  useEffect(() => {
    if (!token) {
      router.replace('/login')
      return
    }
    setBusy(true)
    fetch(`${api}/user/2fa/totp/setup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(body => {
        const data = body?.data ?? body?.result?.data
        if (!data?.secret) throw new Error(body?.error || 'Setup failed')
        setSecret(data.secret)
        setOtpauthUrl(data.otpauthUrl || '')
      })
      .catch(e => toast.error(e.message || 'Could not start MFA setup'))
      .finally(() => setBusy(false))
  }, [token, router])

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
        if (body?.status === 'fail') throw new Error(body?.error || 'Invalid code')
        const data = body?.data ?? body?.result?.data
        setRecoveryCodes(data?.recoveryCodes || [])
        auth.clearMfaEnrollment?.()
        toast.success('MFA enabled')
      })
      .catch(err => toast.error(err.message || 'Confirm failed'))
      .finally(() => setBusy(false))
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Enable admin MFA</h1>
      <p style={{ marginTop: 8, color: '#555' }}>
        Scan the otpauth URI in your authenticator, or enter the secret manually.
        Save recovery codes when shown — they appear once.
      </p>

      {recoveryCodes ? (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontWeight: 600 }}>Recovery codes (store offline):</p>
          <ul style={{ fontFamily: 'monospace', fontSize: 13 }}>
            {recoveryCodes.map(c => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => router.replace('/')}
            style={{
              marginTop: 16,
              width: '100%',
              padding: 12,
              background: '#000080',
              color: '#fff',
              border: 0,
              borderRadius: 8,
              fontWeight: 600
            }}
          >
            Continue to admin
          </button>
        </div>
      ) : (
        <form onSubmit={confirm} style={{ marginTop: 24 }}>
          {otpauthUrl ? (
            <p style={{ fontSize: 12, wordBreak: 'break-all', color: '#333' }}>{otpauthUrl}</p>
          ) : null}
          {secret ? (
            <p style={{ marginTop: 8, fontFamily: 'monospace' }}>Secret: {secret}</p>
          ) : null}
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Authenticator code"
            style={{
              marginTop: 16,
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #ccc',
              borderRadius: 8
            }}
          />
          <button
            type="submit"
            disabled={busy || code.trim().length < 6 || !secret}
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
            {busy ? 'Working…' : 'Confirm and enable'}
          </button>
        </form>
      )}
    </div>
  )
}

MfaEnrollPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
MfaEnrollPage.authGuard = true

export default MfaEnrollPage

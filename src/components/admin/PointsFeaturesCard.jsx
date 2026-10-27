import { useCallback, useContext, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Slider from '@mui/material/Slider'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { getPointsConfig, getPointsPreview, updatePointsConfig } from 'src/services/referralAdminApi'

// Keep in sync with POINTS_FEATURE_KEYS in nq-backend-main/src/modules/points/pointsFeatureRules.ts
const FEATURES = [
  { key: 'earn_lessons', label: 'Earn: lessons & bookings', hint: 'Points awarded when a lesson or booking completes.' },
  { key: 'earn_reviews', label: 'Earn: reviews', hint: 'Points for rating a completed lesson.' },
  { key: 'earn_game_plan', label: 'Earn: game plans', hint: 'Coach points for saving a game plan.' },
  { key: 'earn_referral', label: 'Earn: referrals', hint: 'Referral signup / first-lesson points and the invite tiles.' },
  { key: 'redeem', label: 'Redeem to wallet', hint: 'Off shows the message below instead of the redeem controls. Balances are never touched.' },
  { key: 'hub', label: 'Points screen / tab', hint: 'The Points hub on app and web, and its entry points.' },
  { key: 'home_chip', label: 'Home / header chip', hint: 'Balance chip on the app Home and the web header.' },
  { key: 'earned_feedback', label: '“You earned +N” after a lesson', hint: 'Message shown after rating.' },
  { key: 'push_earned', label: 'Push: points earned', hint: 'One push per lesson with the points credited.' },
  { key: 'push_milestone', label: 'Push: milestone unlocked', hint: '' },
  { key: 'push_expiry', label: 'Push: points expiring', hint: '' },
  { key: 'milestones', label: 'Milestones', hint: 'Milestone bar and milestone pushes.' },
  { key: 'expiry', label: 'Expiry (audience)', hint: 'Who expiry applies to. The expiry on/off and timing live in Settings.' }
]
const PLATFORMS = [
  ['web', 'Web'],
  ['mobile', 'Mobile']
]
const ROLES = [
  ['Trainee', 'Trainee'],
  ['Trainer', 'Trainer']
]

const toggle = (list, v) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v])

/** Per-feature on/off with platform, role and rollout %, plus the master kill switch and a live preview. */
const PointsFeaturesCard = () => {
  const ability = useContext(AbilityContext)
  const canWrite = ability?.can('update', 'admin-nav-points') ?? true
  const [features, setFeatures] = useState(null)
  const [offMessage, setOffMessage] = useState('')
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pv, setPv] = useState({ role: 'Trainee', platform: 'mobile', userId: '' })
  const [preview, setPreview] = useState(null)

  const load = useCallback(async () => {
    try {
      const c = await getPointsConfig()
      setFeatures(c.features)
      setOffMessage(c.offMessage || '')
    } catch (e) {
      setMsg({ severity: 'error', text: e.message })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const patch = (key, change) => setFeatures(f => ({ ...f, [key]: { ...f[key], ...change } }))

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await updatePointsConfig({ features, offMessage, reason })
      setFeatures(res.features ?? features)
      setReason('')
      setMsg({ severity: 'success', text: 'Saved. Apps and web pick this up within about a minute.' })
    } catch (e) {
      setMsg({ severity: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  const runPreview = async () => {
    try {
      setPreview(await getPointsPreview({ role: pv.role, platform: pv.platform, userId: pv.userId.trim() }))
    } catch (e) {
      setMsg({ severity: 'error', text: e.message })
    }
  }

  if (!features) return msg ? <Alert severity={msg.severity}>{msg.text}</Alert> : null

  const master = features.master
  const Row = ({ k, label, hint, big }) => {
    const r = features[k]
    return (
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          alignItems: 'center',
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          gridTemplateColumns: { xs: '1fr', md: '2.4fr 0.7fr 1.3fr 1.5fr 1.6fr' }
        }}
      >
        <Box>
          <Typography sx={{ fontSize: big ? 15 : 13, fontWeight: 600 }}>{label}</Typography>
          {hint ? <Typography sx={{ fontSize: 11 }}>{hint}</Typography> : null}
        </Box>
        <Switch checked={r.enabled} disabled={!canWrite} onChange={e => patch(k, { enabled: e.target.checked })} />
        <Box>
          {PLATFORMS.map(([v, l]) => (
            <FormControlLabel
              key={v}
              label={l}
              control={
                <Checkbox
                  size='small'
                  disabled={!canWrite}
                  checked={r.platforms.length === 0 || r.platforms.includes(v)}
                  onChange={() => {
                    const base = r.platforms.length === 0 ? PLATFORMS.map(p => p[0]) : r.platforms
                    const next = toggle(base, v)
                    patch(k, { platforms: next.length === PLATFORMS.length ? [] : next })
                  }}
                />
              }
            />
          ))}
        </Box>
        <Box>
          {ROLES.map(([v, l]) => (
            <FormControlLabel
              key={v}
              label={l}
              control={
                <Checkbox
                  size='small'
                  disabled={!canWrite}
                  checked={r.roles.length === 0 || r.roles.includes(v)}
                  onChange={() => {
                    const base = r.roles.length === 0 ? ROLES.map(p => p[0]) : r.roles
                    const next = toggle(base, v)
                    patch(k, { roles: next.length === ROLES.length ? [] : next })
                  }}
                />
              }
            />
          ))}
        </Box>
        <Box sx={{ px: 1 }}>
          <Slider
            size='small'
            min={0}
            max={100}
            step={5}
            disabled={!canWrite}
            value={r.rolloutPercent}
            valueLabelDisplay='auto'
            onChange={(_, v) => patch(k, { rolloutPercent: v })}
          />
          <Typography sx={{ fontSize: 11 }}>{r.rolloutPercent}% of eligible users</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <OpsSurfaceCard sx={{ p: 2.5, mb: 3 }}>
      <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>Feature switches.</Typography>
      <Typography sx={{ fontSize: 13, mb: 2 }}>
        Each switch is decided by the server for every user, so a change here reaches the app and the website without a
        release. Turning a feature off hides it; balances and history are never changed. Unchecked platform/role boxes
        exclude that audience; the slider limits it to a stable share of users.
      </Typography>
      {!canWrite ? <Alert severity='info' sx={{ mb: 2 }}>You have read-only access to Points.</Alert> : null}
      {msg ? <Alert severity={msg.severity} sx={{ mb: 2 }}>{msg.text}</Alert> : null}
      {!master.enabled ? (
        <Alert severity='warning' sx={{ mb: 2 }}>
          Master switch is OFF — the Points area is hidden everywhere and nothing is awarded, redeemed or notified.
        </Alert>
      ) : null}

      <Row k='master' label='Master switch (whole points system)' hint='Kill switch. Affects every feature below.' big />
      {FEATURES.map(f => (
        <Row key={f.key} k={f.key} label={f.label} hint={f.hint} />
      ))}

      <TextField
        size='small'
        fullWidth
        label='Message shown when redeeming is off'
        value={offMessage}
        onChange={e => setOffMessage(e.target.value)}
        disabled={!canWrite}
        inputProps={{ maxLength: 280 }}
        sx={{ mt: 3 }}
      />
      <TextField
        size='small'
        fullWidth
        label='Reason for this change (required for master / redeem / expiry changes)'
        value={reason}
        onChange={e => setReason(e.target.value)}
        disabled={!canWrite}
        sx={{ mt: 2 }}
      />
      <Button sx={{ mt: 2 }} variant='contained' onClick={save} disabled={!canWrite || saving}>
        Save feature switches
      </Button>

      <Typography sx={{ fontWeight: 600, mt: 4, mb: 1 }}>Preview what users see.</Typography>
      <Typography sx={{ fontSize: 13, mb: 2 }}>
        Shows the saved state for an audience. Enter a user ID to check that exact person (needed to evaluate rollout %).
      </Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 2fr auto' } }}>
        <TextField select size='small' label='Role' value={pv.role} onChange={e => setPv(p => ({ ...p, role: e.target.value }))}>
          {ROLES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        <TextField select size='small' label='Platform' value={pv.platform} onChange={e => setPv(p => ({ ...p, platform: e.target.value }))}>
          {PLATFORMS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        <TextField size='small' label='User ID (optional)' value={pv.userId} onChange={e => setPv(p => ({ ...p, userId: e.target.value }))} />
        <Button variant='outlined' onClick={runPreview}>Preview</Button>
      </Box>
      {preview ? (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {[
            ['Points area', preview.features.master],
            ['Hub', preview.features.hub],
            ['Home chip', preview.features.homeChip],
            ['Redeem', preview.features.redeem],
            ['Earn lessons', preview.features.earn.lessons],
            ['Earn reviews', preview.features.earn.reviews],
            ['Earn game plan', preview.features.earn.gamePlan],
            ['Earn referral', preview.features.earn.referral],
            ['“You earned”', preview.features.earnedFeedback],
            ['Milestones', preview.features.milestones],
            ['Expiry', preview.features.expiry]
          ].map(([label, on]) => (
            <Typography
              key={label}
              sx={{ fontSize: 12, px: 1.25, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: on ? 'success.main' : 'divider', color: on ? 'success.main' : 'text.secondary' }}
            >
              {label}: {on ? 'on' : 'off'}
            </Typography>
          ))}
        </Box>
      ) : null}
    </OpsSurfaceCard>
  )
}

export default PointsFeaturesCard

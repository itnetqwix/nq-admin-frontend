import { useCallback, useContext, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { adjustUserPoints, getPointsConfig, updatePointsConfig } from 'src/services/referralAdminApi'

const toDollars = minor => (Number(minor) || 0) / 100

/** Admin controls for points redemption (rate, step, daily/monthly caps) and manual per-user adjustments. */
const PointsSettingsCard = () => {
  const ability = useContext(AbilityContext)
  const canWrite = ability?.can('update', 'admin-nav-points') ?? true
  const [reason, setReason] = useState('')
  const [form, setForm] = useState(null)
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rules, setRules] = useState([])
  const [referral, setReferral] = useState([])
  const [adj, setAdj] = useState({ userId: '', points: '', reason: '' })

  const load = useCallback(async () => {
    try {
      const c = await getPointsConfig()
      setForm({
        enabled: !!c.enabled,
        pointsPerDollar: c.pointsPerDollar,
        minRedeemPoints: c.minRedeemPoints,
        redeemStepPoints: c.redeemStepPoints,
        dailyCapDollars: toDollars(c.dailyRedeemCapMinor),
        monthlyCapDollars: toDollars(c.monthlyRedeemCapMinor),
        expiryEnabled: !!c.expiryEnabled,
        expiryMonths: c.expiryMonths,
        expiryWarnDays: c.expiryWarnDays,
        milestones: (c.milestones || []).join(', '),
        maxPointsPerAction: c.maxPointsPerAction
      })
      setRules(
        (c.earnRules || []).map(r => ({
          actionKey: r.actionKey,
          label: r.label,
          roles: (r.roles || []).join(', '),
          points: r.points,
          enabled: r.enabled !== false,
          weeklyCap: r.weeklyCap ?? '',
          dailyCap: r.dailyCap ?? ''
        }))
      )
      setReferral((c.referral || []).map(r => ({ ...r })))
    } catch (e) {
      setMsg({ severity: 'error', text: e.message })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))
  const setRule = (i, key) => e => setRules(rs => rs.map((x, j) => (j === i ? { ...x, [key]: e.target.value } : x)))
  const setRef = (i, key) => e => setReferral(rs => rs.map((x, j) => (j === i ? { ...x, [key]: e.target.value } : x)))

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await updatePointsConfig({
        enabled: form.enabled,
        pointsPerDollar: Number(form.pointsPerDollar),
        minRedeemPoints: Number(form.minRedeemPoints),
        redeemStepPoints: Number(form.redeemStepPoints),
        dailyRedeemCapMinor: Math.round(Number(form.dailyCapDollars) * 100),
        monthlyRedeemCapMinor: Math.round(Number(form.monthlyCapDollars) * 100),
        reason,
        expiryEnabled: form.expiryEnabled,
        expiryMonths: Number(form.expiryMonths),
        expiryWarnDays: Number(form.expiryWarnDays),
        milestones: String(form.milestones)
          .split(',')
          .map(n => Number(n.trim()))
          .filter(n => n > 0),
        maxPointsPerAction: Number(form.maxPointsPerAction),
        earnRules: rules.map(r => ({
          actionKey: r.actionKey,
          points: Number(r.points),
          enabled: r.enabled,
          weeklyCap: r.weeklyCap === '' ? null : Number(r.weeklyCap),
          dailyCap: r.dailyCap === '' ? null : Number(r.dailyCap)
        })),
        referral: referral.map(r => ({
          referrerType: r.referrerType,
          refereeType: r.refereeType,
          signupReferrer: Number(r.signupReferrer),
          signupReferee: Number(r.signupReferee),
          firstBookingReferrer: Number(r.firstBookingReferrer)
        }))
      })
      setReason('')
      setMsg({ severity: 'success', text: 'Points settings saved. Apps pick them up within about a minute.' })
    } catch (e) {
      setMsg({ severity: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  const adjust = async () => {
    setMsg(null)
    try {
      const r = await adjustUserPoints({ userId: adj.userId.trim(), points: Number(adj.points), reason: adj.reason })
      setMsg({ severity: 'success', text: `Adjusted. New balance: ${r.balance} pts.` })
      setAdj({ userId: '', points: '', reason: '' })
    } catch (e) {
      setMsg({ severity: 'error', text: e.message })
    }
  }

  if (!form) return msg ? <Alert severity={msg.severity}>{msg.text}</Alert> : null

  return (
    <OpsSurfaceCard sx={{ p: 2.5, mb: 3 }}>
      {!canWrite ? <Alert severity='info' sx={{ mb: 2 }}>You have read-only access to Points.</Alert> : null}
      <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>Points settings.</Typography>
      <Typography sx={{ fontSize: 13, mb: 2 }}>
        Redemption caps apply per user: daily resets at 00:00 UTC, monthly is a rolling 30 days.
      </Typography>
      {msg ? (
        <Alert severity={msg.severity} sx={{ mb: 2 }}>
          {msg.text}
        </Alert>
      ) : null}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        <TextField size='small' type='number' label='Points per $1' value={form.pointsPerDollar} onChange={set('pointsPerDollar')} />
        <TextField size='small' type='number' label='Minimum redeem (pts)' value={form.minRedeemPoints} onChange={set('minRedeemPoints')} />
        <TextField size='small' type='number' label='Redeem step (pts)' value={form.redeemStepPoints} onChange={set('redeemStepPoints')} />
        <TextField size='small' type='number' label='Daily cap ($)' value={form.dailyCapDollars} onChange={set('dailyCapDollars')} />
        <TextField size='small' type='number' label='Monthly cap ($)' value={form.monthlyCapDollars} onChange={set('monthlyCapDollars')} />
        <FormControlLabel
          control={<Switch checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />}
          label='Redemption enabled'
        />
        <FormControlLabel
          control={<Switch checked={form.expiryEnabled} onChange={e => setForm(f => ({ ...f, expiryEnabled: e.target.checked }))} />}
          label='Expire inactive points'
        />
        <TextField size='small' type='number' label='Expire after (months inactive)' value={form.expiryMonths} onChange={set('expiryMonths')} />
        <TextField size='small' type='number' label='Warn this many days before' value={form.expiryWarnDays} onChange={set('expiryWarnDays')} />
        <TextField size='small' label='Milestones (lifetime pts, comma separated)' value={form.milestones} onChange={set('milestones')} sx={{ gridColumn: { md: 'span 3' } }} />
      </Box>

      <Typography sx={{ fontWeight: 600, mt: 4, mb: 0.5 }}>Earn rules.</Typography>
      <Typography sx={{ fontSize: 13, mb: 2 }}>
        Points per event and optional weekly/daily limits per person. Leave a cap empty for no limit. Plan multipliers
        (Pro/Max) apply on top. Changes reach the apps within ~15 seconds.
      </Typography>
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {rules.map((r, i) => (
          <Box key={r.actionKey} sx={{ display: 'grid', gap: 1.5, alignItems: 'center', gridTemplateColumns: { xs: '1fr 1fr', md: '2.2fr 0.9fr 0.9fr 0.9fr auto' } }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.label}</Typography>
              <Typography sx={{ fontSize: 11 }}>{r.roles}</Typography>
            </Box>
            <TextField size='small' type='number' label='Points' value={r.points} onChange={setRule(i, 'points')} />
            <TextField size='small' type='number' label='Weekly cap' value={r.weeklyCap} onChange={setRule(i, 'weeklyCap')} />
            <TextField size='small' type='number' label='Daily cap' value={r.dailyCap} onChange={setRule(i, 'dailyCap')} />
            <FormControlLabel
              control={<Switch checked={r.enabled} onChange={e => setRules(rs => rs.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} />}
              label='On'
            />
          </Box>
        ))}
      </Box>
      <TextField
        size='small'
        type='number'
        label='Max points per single event'
        helperText='Hard ceiling applied before plan multipliers (also caps referral rewards).'
        value={form.maxPointsPerAction}
        onChange={set('maxPointsPerAction')}
        sx={{ mt: 2, maxWidth: 320 }}
      />

      <Typography sx={{ fontWeight: 600, mt: 4, mb: 0.5 }}>Referral rewards.</Typography>
      <Typography sx={{ fontSize: 13, mb: 2 }}>Points credited when a referred person joins and completes their first lesson.</Typography>
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {referral.map((r, i) => (
          <Box key={`${r.referrerType}:${r.refereeType}`} sx={{ display: 'grid', gap: 1.5, alignItems: 'center', gridTemplateColumns: { xs: '1fr 1fr', md: '1.6fr 1fr 1fr 1fr' } }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              {r.referrerType} invites {r.refereeType}
            </Typography>
            <TextField size='small' type='number' label='Referrer on signup' value={r.signupReferrer} onChange={setRef(i, 'signupReferrer')} />
            <TextField size='small' type='number' label='New user on signup' value={r.signupReferee} onChange={setRef(i, 'signupReferee')} />
            <TextField size='small' type='number' label='Referrer on 1st lesson' value={r.firstBookingReferrer} onChange={setRef(i, 'firstBookingReferrer')} />
          </Box>
        ))}
      </Box>

      <TextField
        size='small'
        fullWidth
        label='Reason for this change (required when changing rates, limits or on/off)'
        value={reason}
        onChange={e => setReason(e.target.value)}
        disabled={!canWrite}
        sx={{ mt: 3 }}
      />
      {Number(form.pointsPerDollar) > 0 ? (
        <Typography sx={{ fontSize: 12, mt: 1 }}>
          Impact: {form.pointsPerDollar} pts = $1 · daily cap ${Number(form.dailyCapDollars).toFixed(2)} ≈{' '}
          {Math.floor(Number(form.dailyCapDollars) * Number(form.pointsPerDollar))} pts · monthly cap $
          {Number(form.monthlyCapDollars).toFixed(2)} ≈{' '}
          {Math.floor(Number(form.monthlyCapDollars) * Number(form.pointsPerDollar))} pts
        </Typography>
      ) : null}
      <Button sx={{ mt: 2 }} variant='contained' onClick={save} disabled={saving || !canWrite}>
        Save all settings
      </Button>

      <Typography sx={{ fontWeight: 600, mt: 4, mb: 1 }}>Manual adjustment.</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 3fr auto' } }}>
        <TextField size='small' label='User ID' value={adj.userId} onChange={e => setAdj(a => ({ ...a, userId: e.target.value }))} />
        <TextField size='small' type='number' label='Points (+/−)' value={adj.points} onChange={e => setAdj(a => ({ ...a, points: e.target.value }))} />
        <TextField size='small' label='Reason (audited)' value={adj.reason} onChange={e => setAdj(a => ({ ...a, reason: e.target.value }))} />
        <Button variant='outlined' onClick={adjust} disabled={!canWrite || !adj.userId || !adj.points || adj.reason.trim().length < 3}>
          Apply
        </Button>
      </Box>
    </OpsSurfaceCard>
  )
}

export default PointsSettingsCard

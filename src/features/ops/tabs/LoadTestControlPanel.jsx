import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import toast from 'react-hot-toast'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { cleanupLoadTestData, fetchLoadTestControl, startLoadTest, stopLoadTest } from 'src/services/loadTestApi'

const PRESETS = [
  { label: 'Smoke', stages: [{ users: 50, holdSec: 15 }] },
  { label: 'Step-up', stages: [500, 1000, 2000, 5000].map(users => ({ users, holdSec: 60 })) }
]

export default function LoadTestControlPanel({ onFinished }) {
  const [ctl, setCtl] = useState(null)
  const [error, setError] = useState('')
  const [armed, setArmed] = useState(false)
  const [label, setLabel] = useState('')
  const [scenarios, setScenarios] = useState(['site'])
  const [stages, setStages] = useState(PRESETS[0].stages)
  const [maxErrorPct, setMaxErrorPct] = useState(5)
  const [maxP95Ms, setMaxP95Ms] = useState(5000)
  const [mix, setMix] = useState({})
  const [confirm, setConfirm] = useState('')
  const [remote, setRemote] = useState(false)
  const [busy, setBusy] = useState(false)
  const wasRunning = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchLoadTestControl()
      setCtl(data)
      setError('')
      const running = data.status !== 'idle'
      if (wasRunning.current && !running) onFinished?.()
      wasRunning.current = running
    } catch (e) {
      setError(e?.message || 'Could not load control status')
    }
  }, [onFinished])

  useEffect(() => {
    void refresh()
    const t = setInterval(() => void refresh(), 4000)
    return () => clearInterval(t)
  }, [refresh])

  const running = ctl && ctl.status !== 'idle'
  const limits = ctl?.limits || {}
  const agent = ctl?.agent || {}
  const useRemote = remote && agent.online
  const toggleScenario = id => {
    setScenarios(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))
    setMix({}) // reset to an equal split whenever the selection changes
  }
  const unlockedIds = (ctl?.scenarios || []).filter(s => !s.locked).map(s => s.id)
  const pickScenarios = ids => {
    setScenarios(ids.filter(id => unlockedIds.includes(id)))
    setMix({})
  }
  const equalShare = scenarios.length ? Math.round((100 / scenarios.length) * 10) / 10 : 0
  const shareOf = id => (mix[id] !== undefined ? Number(mix[id]) : equalShare)
  const mixSum = scenarios.reduce((a, id) => a + shareOf(id), 0)
  const mixValid = scenarios.length < 2 || Math.abs(mixSum - 100) < 0.6
  const setStage = (i, key, val) =>
    setStages(list => list.map((s, idx) => (idx === i ? { ...s, [key]: Number(val) } : s)))

  const onStart = async () => {
    setBusy(true)
    try {
      const mixOut = scenarios.length > 1 ? Object.fromEntries(scenarios.map(id => [id, shareOf(id)])) : undefined
      if (mixOut) {
        // Absorb rounding drift so the server sees exactly 100.
        const drift = 100 - Object.values(mixOut).reduce((a, b) => a + b, 0)
        mixOut[scenarios[0]] = Math.round((mixOut[scenarios[0]] + drift) * 10) / 10
      }
      await startLoadTest(
        { label, source: useRemote ? 'remote' : 'api-host', scenarios, stages, abort: { maxErrorPct, maxP95Ms }, mix: mixOut },
        confirm
      )
      toast.success('Stress test started')
      setConfirm('')
      setArmed(false)
      await refresh()
    } catch (e) {
      toast.error(e?.message || 'Could not start')
    } finally {
      setBusy(false)
    }
  }

  const onStop = async () => {
    setBusy(true)
    try {
      await stopLoadTest()
      toast.success('Stop requested')
      await refresh()
    } catch (e) {
      toast.error(e?.message || 'Could not stop')
    } finally {
      setBusy(false)
    }
  }

  const onCleanup = async () => {
    setBusy(true)
    try {
      const r = await cleanupLoadTestData()
      toast.success(`Removed ${r.users} synthetic accounts, ${r.sessions} sessions, ${r.clips} clips`)
      if (r.errors?.length) toast.error(`${r.errors.length} cleanup errors — check server logs`)
    } catch (e) {
      toast.error(e?.message || 'Cleanup failed')
    } finally {
      setBusy(false)
    }
  }

  const progress = running && ctl.totalStages ? ((ctl.currentStage + 1) / ctl.totalStages) * 100 : 0

  return (
    <AdminPageSection
      title='Stress test control'
      subtitle='Runs against this server. Load comes from the API host itself (a pessimistic floor) unless a remote load agent is connected and selected.'
    >
      {error ? <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert> : null}

      {running ? (
        <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 1 }}>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
            <Typography variant='subtitle1'>{ctl.config?.label} — {ctl.status}</Typography>
            <Button color='error' variant='contained' disabled={busy || ctl.status === 'stopping'} onClick={onStop}>
              STOP NOW
            </Button>
          </Stack>
          <Typography variant='body2' sx={{ mb: 1 }}>{ctl.message}</Typography>
          <LinearProgress variant='determinate' value={progress} />
        </Box>
      ) : ctl?.message ? (
        <Alert severity='info' sx={{ mb: 2 }}>Last run: {ctl.message}</Alert>
      ) : null}

      {!running && ctl ? (
        <Button size='small' variant='outlined' disabled={busy} onClick={onCleanup} sx={{ mb: 1, mr: 2 }}>
          Clean up leftover test data
        </Button>
      ) : null}
      <FormControlLabel
        control={<Switch checked={armed} disabled={running} onChange={e => setArmed(e.target.checked)} />}
        label='Arm stress test'
      />

      {armed && !running ? (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField size='small' label='Run label' value={label} onChange={e => setLabel(e.target.value)} />

          <Box>
            <FormControlLabel
              disabled={!agent.online}
              control={<Switch checked={useRemote} onChange={e => setRemote(e.target.checked)} />}
              label='Generate load from the remote agent'
            />
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', ml: 6 }}>
              {!agent.configured
                ? 'Remote agent not configured on this server (LOADTEST_AGENT_KEY).'
                : agent.online
                  ? `Agent online: ${agent.host}`
                  : 'No agent connected. Start scripts/load-test/agent.mjs on a separate machine.'}
            </Typography>
          </Box>

          <Box>
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap sx={{ mb: 0.5 }}>
              <Typography variant='subtitle2'>Scenarios</Typography>
              <Button size='small' variant='outlined' onClick={() => pickScenarios(unlockedIds)}>
                Full system
              </Button>
              <Button size='small' variant='outlined' onClick={() => pickScenarios(['recordings'])}>
                Recordings only
              </Button>
              <Button
                size='small'
                variant='outlined'
                onClick={() => pickScenarios(['mobile', 'mobile_authenticated'].filter(id => unlockedIds.includes(id)))}
              >
                Mobile only
              </Button>
              <Button size='small' onClick={() => pickScenarios([])}>
                Clear
              </Button>
            </Stack>
            {(ctl?.scenarios || []).map(s => (
              <Box key={s.id}>
                <FormControlLabel
                  disabled={s.locked}
                  control={<Checkbox checked={scenarios.includes(s.id)} onChange={() => toggleScenario(s.id)} />}
                  label={
                    <span>
                      {s.label} {s.locked ? <Chip size='small' label='locked' sx={{ ml: 1 }} /> : null}
                    </span>
                  }
                />
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', ml: 4 }}>
                  {s.locked ? s.lockedReason : s.description}
                </Typography>
              </Box>
            ))}
          </Box>

          {scenarios.length > 1 ? (
            <Box>
              <Typography variant='subtitle2'>
                Mix % (each stage's users are split between scenarios, which run at the same time)
              </Typography>
              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                {scenarios.map(id => (
                  <Grid item xs={6} md={3} key={id}>
                    <TextField
                      size='small'
                      fullWidth
                      type='number'
                      label={id}
                      value={mix[id] !== undefined ? mix[id] : equalShare}
                      onChange={e => setMix(m => ({ ...m, [id]: e.target.value }))}
                    />
                  </Grid>
                ))}
              </Grid>
              <Typography variant='caption' color={mixValid ? 'text.secondary' : 'error'}>
                Total: {Math.round(mixSum * 10) / 10}% {mixValid ? '' : '(must equal 100)'}
              </Typography>
            </Box>
          ) : null}

          <Box>
            <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
              <Typography variant='subtitle2'>User levels</Typography>
              {PRESETS.map(p => (
                <Button key={p.label} size='small' variant='outlined' onClick={() => setStages(p.stages)}>
                  {p.label}
                </Button>
              ))}
            </Stack>
            {stages.map((s, i) => (
              <Grid container spacing={1} key={i} sx={{ mb: 1 }}>
                <Grid item xs={5}>
                  <TextField size='small' fullWidth type='number' label={`Stage ${i + 1} users (max ${limits.maxUsers})`} value={s.users} onChange={e => setStage(i, 'users', e.target.value)} />
                </Grid>
                <Grid item xs={5}>
                  <TextField size='small' fullWidth type='number' label={`Hold sec (${limits.minHoldSec}-${limits.maxHoldSec})`} value={s.holdSec} onChange={e => setStage(i, 'holdSec', e.target.value)} />
                </Grid>
                <Grid item xs={2}>
                  <IconButton disabled={stages.length < 2} onClick={() => setStages(l => l.filter((_, idx) => idx !== i))}>✕</IconButton>
                </Grid>
              </Grid>
            ))}
            <Button size='small' disabled={stages.length >= (limits.maxStages || 8)} onClick={() => setStages(l => [...l, { users: 100, holdSec: 30 }])}>
              + Add stage
            </Button>
          </Box>

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <TextField size='small' fullWidth type='number' label='Auto-stop: error rate % above' value={maxErrorPct} onChange={e => setMaxErrorPct(Number(e.target.value))} />
            </Grid>
            <Grid item xs={6}>
              <TextField size='small' fullWidth type='number' label='Auto-stop: p95 ms above' value={maxP95Ms} onChange={e => setMaxP95Ms(Number(e.target.value))} />
            </Grid>
          </Grid>

          <Alert severity='warning'>
            This runs on production and creates temporary synthetic accounts (deleted automatically afterwards; no email,
            SMS or push is sent to them). Real users may see slowdowns. Type <b>{ctl?.confirmPhrase}</b> to start.
          </Alert>
          <TextField size='small' label='Confirmation' value={confirm} onChange={e => setConfirm(e.target.value)} />
          <Button
            variant='contained'
            color='error'
            disabled={busy || confirm !== ctl?.confirmPhrase || !scenarios.length || !mixValid}
            onClick={onStart}
          >
            Start stress test
          </Button>
        </Stack>
      ) : null}
    </AdminPageSection>
  )
}

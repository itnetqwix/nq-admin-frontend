import { useCallback, useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import PointsFeaturesCard from 'src/components/admin/PointsFeaturesCard'
import PointsHistoryTab from 'src/components/admin/PointsHistoryTab'
import PointsSettingsCard from 'src/components/admin/PointsSettingsCard'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import {
  adjustUserPoints,
  getPointsLedger,
  getPointsOverview,
  getPointsReconcile
} from 'src/services/referralAdminApi'

const fmtMoney = minor =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(minor) || 0) / 100)
const fmtWhen = v => (v ? new Date(v).toLocaleString() : '—')

const OverviewTab = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    getPointsOverview().then(setData).catch(e => setError(e.message))
  }, [])
  const days = (data?.redemptionsByDay ?? []).map(d => ({ id: d._id, ...d }))
  return (
    <>
      {error ? <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert> : null}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}><OpsMetricTile label='Points issued' value={`${data?.issued ?? 0} pts`} /></Grid>
        <Grid item xs={12} sm={4}><OpsMetricTile label='Points redeemed' value={`${data?.redeemed ?? 0} pts`} /></Grid>
        <Grid item xs={12} sm={4}><OpsMetricTile label='Points expired' value={`${data?.expired ?? 0} pts`} /></Grid>
      </Grid>
      <Typography sx={{ fontWeight: 600, mb: 1 }}>Redemptions, last 30 days.</Typography>
      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminGridContainer>
          <AdminDataGrid
            rows={days}
            columns={[
              { field: '_id', headerName: 'Day', width: 130 },
              { field: 'count', headerName: 'Redemptions', width: 130 },
              { field: 'points', headerName: 'Points', width: 110 },
              { field: 'amountMinor', headerName: 'Wallet credit', width: 140, valueGetter: p => fmtMoney(p.row.amountMinor) }
            ]}
            autoHeight
            hideFooter
          />
        </AdminGridContainer>
      </OpsSurfaceCard>
    </>
  )
}

const LedgerTab = () => {
  const [userId, setUserId] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setLoading(true)
    setError('')
    try {
      setData(await getPointsLedger({ userId: userId.trim(), limit: 100 }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField size='small' label='User ID' value={userId} onChange={e => setUserId(e.target.value)} sx={{ minWidth: 320 }} />
        <Button variant='contained' onClick={search} disabled={!userId.trim() || loading}>Load ledger</Button>
      </Box>
      {error ? <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert> : null}
      {data ? (
        <>
          <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden', mb: 3 }}>
            <AdminGridContainer>
              <AdminDataGrid
                rows={(data.entries ?? []).map(e => ({ id: e._id, ...e }))}
                columns={[
                  { field: 'createdAt', headerName: 'When', width: 180, valueGetter: p => fmtWhen(p.row.createdAt) },
                  { field: 'label', headerName: 'Action', flex: 1, minWidth: 180, valueGetter: p => p.row.label || p.row.action_key },
                  { field: 'points', headerName: 'Points', width: 100 },
                  { field: 'balance_after', headerName: 'Balance after', width: 130 },
                  { field: 'reference_type', headerName: 'Ref', width: 110 }
                ]}
                autoHeight
                pageSizeOptions={[25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              />
            </AdminGridContainer>
          </OpsSurfaceCard>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Redemptions.</Typography>
          <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
            <AdminGridContainer>
              <AdminDataGrid
                rows={(data.redemptions ?? []).map(r => ({ id: r._id, ...r }))}
                columns={[
                  { field: 'createdAt', headerName: 'When', width: 180, valueGetter: p => fmtWhen(p.row.createdAt) },
                  { field: 'points_spent', headerName: 'Points', width: 100 },
                  { field: 'amount_minor', headerName: 'Credit', width: 110, valueGetter: p => fmtMoney(p.row.amount_minor) },
                  { field: 'status', headerName: 'Status', width: 120 },
                  { field: 'failure_reason', headerName: 'Failure', flex: 1, minWidth: 160 }
                ]}
                autoHeight
                hideFooter
              />
            </AdminGridContainer>
          </OpsSurfaceCard>
        </>
      ) : null}
    </>
  )
}

const ReconcileTab = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await getPointsReconcile())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Align the stored balance with the ledger. Always audited with a reason; nothing here runs automatically.
  const fix = async row => {
    if (!window.confirm(`Adjust ${row.name || row.email} by ${-row.diff} pts so balance matches the ledger (${row.ledgerSum})?`)) return
    try {
      await adjustUserPoints({ userId: row.userId, points: -row.diff, reason: `Reconcile: balance ${row.balance} vs ledger ${row.ledgerSum}` })
      setNote(`Adjusted ${row.name || row.email}.`)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'User', flex: 1, minWidth: 160, valueGetter: p => p.row.name || p.row.email },
      { field: 'accountType', headerName: 'Type', width: 100 },
      { field: 'balance', headerName: 'Balance', width: 100 },
      { field: 'ledgerSum', headerName: 'Ledger sum', width: 110 },
      { field: 'diff', headerName: 'Diff', width: 90 },
      {
        field: 'actions',
        headerName: '',
        width: 160,
        sortable: false,
        renderCell: p => (
          <Button size='small' onClick={() => fix(p.row)}>Align to ledger</Button>
        )
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <>
      <Alert severity='info' sx={{ mb: 2 }}>
        Report only: lists users whose stored balance differs from their ledger. Review before adjusting — a positive diff
        may be a legitimate manual grant.
      </Alert>
      {data?.stuckPending ? (
        <Alert severity='warning' sx={{ mb: 2 }}>{data.stuckPending} redemption(s) stuck in “pending”; the sweeper retries every 10 minutes.</Alert>
      ) : null}
      {error ? <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert> : null}
      {note ? <Alert severity='success' sx={{ mb: 2 }}>{note}</Alert> : null}
      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminGridContainer>
          <AdminDataGrid
            rows={(data?.rows ?? []).map(r => ({ id: r.userId, ...r }))}
            columns={columns}
            loading={loading}
            autoHeight
            pageSizeOptions={[25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          />
        </AdminGridContainer>
      </OpsSurfaceCard>
      <Typography sx={{ mt: 1, fontSize: 12 }}>{data ? `${data.totalDrifting} user(s) drifting` : ''}</Typography>
      <Box sx={{ mt: 1 }}><AdminRefreshButton onClick={load} loading={loading} /></Box>
    </>
  )
}

const PointsAdminPage = () => {
  const [tab, setTab] = useState(0)
  return (
    <AdminPageShell
      bare
      eyebrow='Revenue · points'
      icon='mdi:star-circle-outline'
      title='Points.'
      subtitle='Redemption settings, per-user ledger, balance reconciliation and totals.'
    >
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label='Overview' />
        <Tab label='Settings' />
        <Tab label='Features' />
        <Tab label='Ledger' />
        <Tab label='Reconcile' />
        <Tab label='History' />
      </Tabs>
      {tab === 0 ? <OverviewTab /> : null}
      {tab === 1 ? <PointsSettingsCard /> : null}
      {tab === 2 ? <PointsFeaturesCard /> : null}
      {tab === 3 ? <LedgerTab /> : null}
      {tab === 4 ? <ReconcileTab /> : null}
      {tab === 5 ? <PointsHistoryTab /> : null}
    </AdminPageShell>
  )
}

export default PointsAdminPage

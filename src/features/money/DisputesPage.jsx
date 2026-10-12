import { useContext, useState } from 'react'
import { useRouter } from 'next/router'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Pagination from '@mui/material/Pagination'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminTabs from 'src/components/admin/AdminTabs'
import KpiTile from 'src/components/admin/KpiTile'
import Money from 'src/components/admin/Money'
import StatusPill from 'src/components/admin/StatusPill'
import { useEntityDrawer } from 'src/features/entity-drawers/EntityDrawerContext'
import useDebouncedValue from 'src/hooks/useDebouncedValue'
import { backfillDisputes, listDisputes } from 'src/services/moneyApi'
import { ops } from 'src/styles/opsSurface'
import { formatInt, formatMinor, formatPct, timeAgo } from 'src/utils/format'
import { disputeUrgency, reasonLabel } from './moneyView'

const PAGE_SIZE = 25
const TABS = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' }
]
const one = v => (Array.isArray(v) ? v[0] : v)

export default function DisputesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const drawer = useEntityDrawer()
  const ability = useContext(AbilityContext)
  const canBackfill = ability?.can('update', 'admin-action-refund') ?? true

  const state = TABS.some(t => t.value === one(router.query.state)) ? one(router.query.state) : 'open'
  const page = Math.max(1, Number(one(router.query.page)) || 1)
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 300)

  const setParam = patch =>
    router.replace({ pathname: router.pathname, query: { ...router.query, page: undefined, ...patch } }, undefined, { shallow: true })

  const query = useQuery({
    queryKey: ['disputes', { state, q, page }],
    queryFn: () => listDisputes({ state: state === 'all' ? undefined : state, q: q || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000
  })

  const backfill = useMutation({
    mutationFn: dryRun => backfillDisputes(dryRun),
    onSuccess: (r, dryRun) => {
      if (dryRun) {
        toast.success(`Found ${r.disputes} disputes in ${r.events} stored events. Run again to import.`)
      } else {
        toast.success(`Imported ${r.applied} dispute events`)
        queryClient.invalidateQueries({ queryKey: ['disputes'] })
      }
    },
    onError: e => toast.error(e?.message || 'Import failed')
  })

  const summary = query.data?.summary
  const rows = (query.data?.items || []).map(d => ({ d, u: disputeUrgency(d) }))
  const totalPages = Math.max(1, Math.ceil((query.data?.total || 0) / PAGE_SIZE))

  return (
    <AdminPageShell
      title='Disputes'
      subtitle='Chargebacks from card issuers. Each has an evidence deadline: miss it and the money is lost automatically.'
      actions={<AdminRefreshButton onClick={() => query.refetch()} loading={query.isFetching} />}
    >
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} md={3}>
          <KpiTile label='Open' value={formatInt(summary?.open)} loading={!summary} tone={summary?.open ? 'danger' : undefined} hint={summary ? `${formatMinor(summary.openMinor)} at stake` : ''} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiTile label='Need evidence' value={formatInt(summary?.needsEvidence)} loading={!summary} hint='no evidence submitted yet' />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiTile label='Win rate' value={summary?.winRate == null ? '—' : formatPct(summary.winRate, 0)} loading={!summary} hint={summary ? `${summary.won} won · ${summary.lost} lost` : ''} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiTile label='Lost to chargebacks' value={formatMinor(summary?.lostMinor)} loading={!summary} hint='all time' />
        </Grid>
      </Grid>

      <AdminTabs value={state} onChange={v => setParam({ state: v === 'open' ? undefined : v })} tabs={TABS} />
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
        <TextField size='small' label='Search dispute, payment or lesson id' value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 280 }} />
        <Box sx={{ flex: 1 }} />
        {canBackfill ? (
          <>
            <Button size='small' variant='outlined' disabled={backfill.isPending} onClick={() => backfill.mutate(true)}>
              Check for missing
            </Button>
            <Button size='small' variant='outlined' disabled={backfill.isPending} onClick={() => backfill.mutate(false)}>
              Import past disputes
            </Button>
          </>
        ) : null}
      </Box>

      {query.isError && !query.data ? (
        <AdminEmptyState title='Couldn’t load disputes' description={query.error?.message} actionLabel='Try again' onAction={() => query.refetch()} />
      ) : !rows.length && !query.isLoading ? (
        <AdminEmptyState
          title={state === 'open' ? 'No open disputes' : 'No disputes here'}
          description={state === 'open' ? 'Nothing needs a response. If you expected some, use “Import past disputes”.' : undefined}
        />
      ) : (
        <TableContainer sx={{ bgcolor: ops.canvas, borderRadius: ops.radiusLg, border: `1px solid ${ops.hairline}` }}>
          <Table size='small' aria-label='Disputes'>
            <TableHead>
              <TableRow>
                {['Status', 'Amount', 'Reason', 'Trainee', 'Coach', 'Opened', 'Dispute'].map(h => (
                  <TableCell key={h} sx={{ fontFamily: ops.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: ops.mute }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ d, u }) => {
                const open = () => drawer.open('dispute', d.stripe_dispute_id)
                return (
                  <TableRow
                    key={d._id}
                    hover
                    tabIndex={0}
                    role='button'
                    onClick={open}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
                    sx={{ cursor: 'pointer', '&:focus-visible': { outline: `2px solid ${ops.accent}`, outlineOffset: -2 } }}
                  >
                    <TableCell><StatusPill tone={u.tone} size='sm'>{u.label}</StatusPill></TableCell>
                    <TableCell><Money minor={d.amount_minor} currency={String(d.currency || 'usd').toUpperCase()} sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell>{reasonLabel(d.reason)}</TableCell>
                    <TableCell>{d.trainee_id?.fullname || '—'}</TableCell>
                    <TableCell>{d.trainer_id?.fullname || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{d.opened_at ? timeAgo(d.opened_at) : '—'}</TableCell>
                    <TableCell sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>{d.stripe_dispute_id}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {totalPages > 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setParam({ page: p === 1 ? undefined : p })} />
        </Box>
      ) : null}
      <Typography sx={{ mt: 2, fontSize: 12, color: ops.mute }}>
        Responding to a dispute (uploading evidence) is done in the Stripe Dashboard. Notes here are for your team.
      </Typography>
    </AdminPageShell>
  )
}

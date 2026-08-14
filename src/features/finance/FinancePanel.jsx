import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Link from 'next/link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminTabs from 'src/components/admin/AdminTabs'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import FinanceOverviewPanel from 'src/components/admin/finance/FinanceOverviewPanel'
import FinanceTabGuide, { FinanceTabLegend } from 'src/components/admin/finance/FinanceTabGuide'
import { ops } from 'src/styles/opsSurface'
import { formatMinor, searchPlaceholder, TAB, tabLabels } from './constants'

export default function FinancePanel(p) {
  const {
    stuckStripVisible, moneyAtRisk, opsDashboard, heldSummary, aging, escrowSummary,
    tab, syncTab, handleGoTab, handleOverviewReconcile, page, loading, pageSize, total, setPage,
    searchQ, setSearchQ, refundStatus, setRefundStatus, escrowStatus, setEscrowStatus,
    ledgerReferenceType, setLedgerReferenceType, rows, cols
  } = p
  return (
    <>
      <AdminPageSection>
        {stuckStripVisible ? (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: ops.radiusMd,
              border: `1px solid ${ops.hairline}`,
              bgcolor: ops.canvasSoft
            }}
          >
            <Stack direction='row' justifyContent='space-between' alignItems='baseline' flexWrap='wrap' gap={1} sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Stuck money</Typography>
              {moneyAtRisk?.totalMinor != null ? (
                <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>
                  At risk · ${(Number(moneyAtRisk.totalMinor) / 100).toFixed(2)}
                </Typography>
              ) : null}
            </Stack>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <Chip
                component={Link}
                href='/apps/finance?tab=escrow'
                clickable
                label={`Held: ${opsDashboard.heldCount ?? 0}${
                  moneyAtRisk?.heldMinor != null ? ` · $${(moneyAtRisk.heldMinor / 100).toFixed(0)}` : ''
                }`}
                color={(opsDashboard.heldCount ?? 0) > 0 ? 'warning' : 'default'}
                size='small'
                variant='outlined'
              />
              <Chip
                component={Link}
                href='/apps/finance?tab=escrow'
                clickable
                label={`Releasing: ${opsDashboard.releasingCount ?? 0}`}
                color={(opsDashboard.releasingCount ?? 0) > 0 ? 'warning' : 'default'}
                size='small'
                variant='outlined'
                onClick={e => {
                  e.preventDefault()
                  handleGoTab('escrow', { status: 'releasing' })
                }}
              />
              <Chip
                component={Link}
                href='/apps/finance?tab=escrow'
                clickable
                label={`Disputed: ${opsDashboard.disputedCount ?? 0}`}
                color={(opsDashboard.disputedCount ?? 0) > 0 ? 'error' : 'default'}
                size='small'
                variant='outlined'
                onClick={e => {
                  e.preventDefault()
                  handleGoTab('escrow', { status: 'disputed' })
                }}
              />
              <Chip
                component={Link}
                href='/apps/finance?tab=refunds'
                clickable
                label={`Open refunds: ${opsDashboard.openRefundCount ?? 0}${
                  moneyAtRisk?.openRefundMinor != null
                    ? ` · $${(moneyAtRisk.openRefundMinor / 100).toFixed(0)}`
                    : ''
                }`}
                color={(opsDashboard.openRefundCount ?? 0) > 0 ? 'error' : 'default'}
                size='small'
                variant='outlined'
              />
              <Chip
                component={Link}
                href='/apps/finance?tab=payouts'
                clickable
                label={`Pending payouts: ${opsDashboard.pendingPayoutCount ?? 0}${
                  moneyAtRisk?.pendingPayoutMinor != null
                    ? ` · $${(moneyAtRisk.pendingPayoutMinor / 100).toFixed(0)}`
                    : ''
                }`}
                color={(opsDashboard.pendingPayoutCount ?? 0) > 0 ? 'warning' : 'default'}
                size='small'
                variant='outlined'
              />
              <Chip
                component={Link}
                href='/apps/finance?tab=stuck_topups'
                clickable
                label={`Stuck top-ups: ${opsDashboard.stuckTopUpsPending30m ?? 0}`}
                size='small'
                variant='outlined'
              />
            </Stack>
          </Box>
        ) : null}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
          {tab !== TAB.OVERVIEW ? (
            <>
          <TextField
            size='small'
            label={searchPlaceholder(tab)}
            placeholder={searchPlaceholder(tab)}
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            sx={{ minWidth: 280, flex: 1 }}
          />
          <Button
            size='small'
            variant='contained'
            onClick={() => {
              setTab(TAB.TRANSACTIONS)
              setPage(1)
            }}
          >
            Search
          </Button>
          {tab === TAB.REFUNDS ? (
            <TextField
              select
              size='small'
              label='Refund status'
              value={refundStatus}
              onChange={e => setRefundStatus(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='pending'>Pending</MenuItem>
              <MenuItem value='processing'>Processing</MenuItem>
              <MenuItem value='completed'>Completed</MenuItem>
              <MenuItem value='failed'>Failed</MenuItem>
            </TextField>
          ) : null}
          {tab === TAB.ESCROW ? (
            <TextField
              select
              size='small'
              label='Escrow status'
              value={escrowStatus}
              onChange={e => setEscrowStatus(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='held'>Held</MenuItem>
              <MenuItem value='released'>Released</MenuItem>
              <MenuItem value='refunded'>Refunded</MenuItem>
              <MenuItem value='releasing'>Releasing</MenuItem>
              <MenuItem value='disputed'>Disputed</MenuItem>
            </TextField>
          ) : null}
          {tab === TAB.LEDGER ? (
            <TextField
              select
              size='small'
              label='Reference type'
              value={ledgerReferenceType}
              onChange={e => setLedgerReferenceType(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='topup'>topup</MenuItem>
              <MenuItem value='booking_escrow'>booking_escrow</MenuItem>
              <MenuItem value='escrow_release'>escrow_release</MenuItem>
              <MenuItem value='escrow_refund'>escrow_refund</MenuItem>
              <MenuItem value='payout'>payout</MenuItem>
              <MenuItem value='migration_opening'>migration_opening</MenuItem>
            </TextField>
          ) : null}
            </>
          ) : null}
        </Stack>

        {tab !== TAB.OVERVIEW && opsDashboard ? (
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
            <Chip
              label={`Transfer failures (7d): ${opsDashboard.transferFailuresLast7d ?? 0}`}
              size='small'
              variant='outlined'
            />
            <Chip
              label={`Extension reconcile alerts (7d): ${opsDashboard.extensionReconcileAlerts7d ?? 0}`}
              color={(opsDashboard.extensionReconcileAlerts7d ?? 0) > 0 ? 'error' : 'default'}
              size='small'
              variant='outlined'
              component='a'
              href='/apps/ops-logs?category=payment&event_type=EXTENSION_RECONCILE_ALERT'
              clickable
            />
            <Chip
              label={`Paid-unapplied extensions: ${opsDashboard.paidUnappliedExtensions ?? 0}`}
              size='small'
              variant='outlined'
            />
          </Stack>
        ) : null}

        {tab === TAB.ESCROW && escrowSummary ? (
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
            <Chip
              label={`Held: ${heldSummary?.count ?? 0} · $${formatMinor(heldSummary?.totalMinor)}`}
              color='warning'
              variant='outlined'
            />
            <Chip label={`<24h: ${aging?.under24h ?? 0}`} size='small' />
            <Chip label={`1–7d: ${aging?.d1to7 ?? 0}`} size='small' />
            <Chip label={`7–30d: ${aging?.d7to30 ?? 0}`} size='small' />
            <Chip label={`30d+: ${aging?.over30 ?? 0}`} size='small' color='error' variant='outlined' />
            {Object.entries(escrowSummary.byStatus || {}).map(([status, row]) => (
              <Chip
                key={status}
                size='small'
                variant='outlined'
                label={`${status}: ${row.count} ($${formatMinor(row.totalMinor)})`}
              />
            ))}
          </Stack>
        ) : null}

        <AdminTabs
          value={tab}
          onChange={syncTab}
          tabs={tabLabels.map((label, index) => ({ value: index, label }))}
        />
        <FinanceTabGuide tab={tab} />
        {tab === TAB.OVERVIEW ? <FinanceTabLegend /> : null}
        {tab !== TAB.OVERVIEW ? (
        <Stack direction='row' spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
          <Button size='small' disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button
            size='small'
            disabled={page * pageSize >= total || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
          <Typography variant='body2' color='text.secondary'>
            Page {page}
            {total ? ` · ${total} total` : ''}
          </Typography>
        </Stack>
        ) : null}
        {tab === TAB.OVERVIEW ? (
          <FinanceOverviewPanel
            opsDashboard={opsDashboard}
            escrowSummary={escrowSummary}
            onGoTab={handleGoTab}
            onReconcile={handleOverviewReconcile}
          />
        ) : (
        <AdminGridContainer>
          <AdminDataGrid
            autoHeight={false}
            rows={rows.map((r, i) => ({ id: r._id ?? r.entry_id ?? r.id ?? i, ...r }))}
            columns={cols}
            loading={loading}
            getRowHeight={() => 64}
          />
        </AdminGridContainer>
        )}
      </AdminPageSection>

    </>
  )
}

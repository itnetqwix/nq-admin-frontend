import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import toast from 'react-hot-toast'
import { adjustWallet, migrateLegacyBalances, refundWalletSession } from 'src/services/financeApi'

export default function FinanceDialogs(p) {
  const {
    adjustOpen, setAdjustOpen, adjustForm, setAdjustForm, load,
    walletRefundOpen, setWalletRefundOpen, walletRefundForm, setWalletRefundForm,
    migrateOpen, setMigrateOpen, migrateDryRun, setMigrateDryRun, migrateBusy, setMigrateBusy,
    migrateResult, setMigrateResult, ConfirmDialog
  } = p
  return (
    <>
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Wallet adjustment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label='Wallet account ID'
              value={adjustForm.walletAccountId}
              onChange={e => setAdjustForm(f => ({ ...f, walletAccountId: e.target.value }))}
              fullWidth
            />
            <TextField
              label='Amount (minor cents)'
              type='number'
              value={adjustForm.amount_minor}
              onChange={e => setAdjustForm(f => ({ ...f, amount_minor: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label='Direction'
              value={adjustForm.direction}
              onChange={e => setAdjustForm(f => ({ ...f, direction: e.target.value }))}
              fullWidth
            >
              <MenuItem value='credit'>Credit</MenuItem>
              <MenuItem value='debit'>Debit</MenuItem>
            </TextField>
            <TextField
              label='Reason'
              value={adjustForm.reason}
              onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
              helperText='Required. Stored on the finance audit log.'
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            disabled={String(adjustForm.reason || '').trim().length < 3}
            onClick={async () => {
              try {
                await adjustWallet({
                  walletAccountId: adjustForm.walletAccountId,
                  amount_minor: Number(adjustForm.amount_minor),
                  direction: adjustForm.direction,
                  reason: adjustForm.reason
                })
                toast.success('Wallet adjusted')
                setAdjustOpen(false)
                load()
              } catch (e) {
                toast.error(e?.message || 'Adjustment failed')
              }
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={walletRefundOpen} onClose={() => setWalletRefundOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Wallet refund (no card intent)</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1, mb: 1 }}>
            Credits the enthusiast wallet for a session with no Stripe PaymentIntent. Instant. Duplicate refunds for the same session+kind are blocked.
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label='Session ID'
              value={walletRefundForm.sessionId}
              onChange={e => setWalletRefundForm(f => ({ ...f, sessionId: e.target.value }))}
              fullWidth
            />
            <TextField
              label='Trainee ID'
              value={walletRefundForm.traineeId}
              onChange={e => setWalletRefundForm(f => ({ ...f, traineeId: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label='Kind'
              value={walletRefundForm.kind}
              onChange={e => setWalletRefundForm(f => ({ ...f, kind: e.target.value }))}
              fullWidth
            >
              <MenuItem value='booking'>Booking</MenuItem>
              <MenuItem value='extension'>Extension</MenuItem>
            </TextField>
            <TextField
              label='Reason'
              value={walletRefundForm.reason}
              onChange={e => setWalletRefundForm(f => ({ ...f, reason: e.target.value }))}
              helperText='Required. Stored on the finance audit log.'
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWalletRefundOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            color='warning'
            disabled={
              !walletRefundForm.sessionId ||
              !walletRefundForm.traineeId ||
              String(walletRefundForm.reason || '').trim().length < 3
            }
            onClick={async () => {
              try {
                await refundWalletSession(walletRefundForm)
                toast.success('Wallet refund submitted')
                setWalletRefundOpen(false)
                load()
              } catch (e) {
                toast.error(e?.message || 'Refund failed')
              }
            }}
          >
            Refund
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={migrateOpen} onClose={() => setMigrateOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Migrate legacy trainer balances</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Maps legacy <code>user.wallet_amount</code> to ledger opening balances. Run dry-run first.
          </Typography>
          <TextField
            select
            fullWidth
            size='small'
            label='Mode'
            value={migrateDryRun ? 'dry' : 'live'}
            onChange={e => setMigrateDryRun(e.target.value === 'dry')}
          >
            <MenuItem value='dry'>Dry run (preview only)</MenuItem>
            <MenuItem value='live'>Apply migration</MenuItem>
          </TextField>
          {migrateResult ? (
            <Typography variant='body2' sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(migrateResult, null, 2)}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMigrateOpen(false)}>Close</Button>
          <Button
            variant='contained'
            disabled={migrateBusy}
            onClick={async () => {
              setMigrateBusy(true)
              try {
                const result = await migrateLegacyBalances(migrateDryRun)
                setMigrateResult(result)
                toast.success(migrateDryRun ? 'Dry run complete' : 'Migration applied')
                if (!migrateDryRun) load()
              } catch (e) {
                toast.error(e?.message || 'Migration failed')
              } finally {
                setMigrateBusy(false)
              }
            }}
          >
            {migrateDryRun ? 'Run dry-run' : 'Apply migration'}
          </Button>
        </DialogActions>
      </Dialog>
      {ConfirmDialog}

    </>
  )
}

import { useState } from 'react'
import Link from 'next/link'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { ops } from 'src/styles/opsSurface'

/** Buttons in the finance page header. Money actions appear only for roles allowed to use them. */
export default function FinanceHeaderActions({
  showExport,
  onExport,
  allowAdjust,
  onAdjust,
  allowRefund,
  onWalletRefund,
  allowReconcile,
  onMigrate,
  onReconcile,
  onRefresh,
  loading
}) {
  const [anchor, setAnchor] = useState(null)
  const close = () => setAnchor(null)
  const pick = fn => () => {
    close()
    fn?.()
  }
  return (
    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
      <Chip component={Link} href='/apps/finance/connect' label='Stripe Connect' clickable variant='outlined' size='small' />
      <Chip component={Link} href='/apps/pricing' label='Pricing' clickable variant='outlined' size='small' />
      {showExport ? (
        <Button size='small' variant='outlined' onClick={onExport} sx={{ textTransform: 'none' }}>
          Export CSV
        </Button>
      ) : null}
      {allowAdjust ? (
        <Button size='small' variant='contained' onClick={onAdjust} sx={{ textTransform: 'none', bgcolor: ops?.ink || '#171717' }}>
          Adjust wallet
        </Button>
      ) : null}
      {allowRefund ? (
        <Button size='small' variant='outlined' onClick={onWalletRefund} sx={{ textTransform: 'none' }}>
          Wallet refund
        </Button>
      ) : null}
      <Button size='small' variant='outlined' endIcon={<ExpandMoreIcon />} onClick={e => setAnchor(e.currentTarget)} sx={{ textTransform: 'none' }}>
        More
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem component={Link} href='/apps/ops?tab=health' onClick={close}>
          <ListItemText primary='Platform health' secondary='Messaging & service checks' />
        </MenuItem>
        <MenuItem onClick={pick(onMigrate)}>
          <ListItemText primary='Migrate legacy balances' secondary='One-time wallet migration' />
        </MenuItem>
        {allowReconcile ? (
          <MenuItem onClick={pick(() => onReconcile('topups'))}>
            <ListItemText primary='Reconcile top-ups' />
          </MenuItem>
        ) : null}
        {allowReconcile ? (
          <MenuItem onClick={pick(() => onReconcile('refunds'))}>
            <ListItemText primary='Reconcile refunds' />
          </MenuItem>
        ) : null}
        {allowReconcile ? (
          <MenuItem onClick={pick(() => onReconcile('releasing'))}>
            <ListItemText primary='Reconcile releasing holds' />
          </MenuItem>
        ) : null}
      </Menu>
      <AdminRefreshButton onClick={onRefresh} loading={loading} />
    </Stack>
  )
}

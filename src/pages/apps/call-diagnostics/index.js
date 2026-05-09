import { Box, Button, Grid, TextField } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import styles from 'styles/common.module.css'
import { getCallDiagnostics } from 'src/services/user360Api'
import moment from 'moment'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'

export default function CallDiagnosticsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [userId, setUserId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = { limit: 100, skip: 0 }
      if (sessionId.trim()) q.sessionId = sessionId.trim()
      if (userId.trim()) q.userId = userId.trim()
      const data = await getCallDiagnostics(q)
      const list = data?.diagnostics || []
      setRows(
        list.map((r, i) => ({
          id: r._id || i,
          ...r,
          userLabel: r.userId?.fullname || r.userId?.email || r.userId || '—',
          at: r.createdAt
        }))
      )
    } catch (e) {
      toast.error(e?.message || 'Failed to load diagnostics')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [sessionId, userId])

  useEffect(() => {
    void load()
  }, [])

  const columns = [
    {
      field: 'at',
      headerName: 'When',
      width: 170,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm:ss') : '')
    },
    { field: 'eventType', headerName: 'Event', width: 160, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'sessionId', headerName: 'Session', width: 220, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'userLabel', headerName: 'User', width: 180, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'role', headerName: 'Role', width: 90, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] }
  ]

  return (
    <AdminPageShell
      title='Call diagnostics'
      subtitle='Video and session quality events. Filter by session id or user Mongo id, then apply.'
      actions={
        <Button variant='contained' onClick={() => void load()}>
          Apply filters
        </Button>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={5}>
            <TextField size='small' fullWidth label='Session id' value={sessionId} onChange={e => setSessionId(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField size='small' fullWidth label='User id' value={userId} onChange={e => setUserId(e.target.value)} />
          </Grid>
        </Grid>
        <Box className='admin-data-grid' sx={{ height: 560, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            disableRowSelectionOnClick
          />
        </Box>
      </AdminPageSection>
    </AdminPageShell>
  )
}

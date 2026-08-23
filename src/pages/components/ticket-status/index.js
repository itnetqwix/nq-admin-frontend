import { FormControl, MenuItem, Select } from '@mui/material'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { statusColors, updateTicketBaseUrl } from 'src/utils/utils'
import { patchRaiseConcernTicket, patchWriteUsTicket } from 'src/services/supportApi'

const OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
]

function displayStatus(v) {
  const s = String(v || 'open').toLowerCase()
  return s === 'close' ? 'closed' : s
}

export default function TicketStatusComponent({ params, base, cb }) {
  const [status, setStatus] = useState(displayStatus(params.row.ticket_status))
  const [busy, setBusy] = useState(false)

  const handleChange = async event => {
    const next = event.target.value
    const prev = status
    setStatus(next)
    setBusy(true)
    try {
      const id = params.row._id || params.row.id
      if (base === updateTicketBaseUrl.write_us) {
        await patchWriteUsTicket(id, next)
      } else {
        await patchRaiseConcernTicket(id, next)
      }
      cb?.()
    } catch (e) {
      setStatus(prev)
      toast.error(e?.message || 'Could not update ticket')
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormControl required sx={{ m: 1, minWidth: 120, height: '50px' }}>
      <Select
        labelId='ticket-status-label'
        id='ticket-status-select'
        value={status}
        disabled={busy}
        onChange={e => void handleChange(e)}
        style={{
          maxHeight: '40px',
          marginTop: '5px',
          color: 'white',
          background: statusColors[status] || statusColors.open
        }}
      >
        {OPTIONS.map(o => (
          <MenuItem key={o.value} value={o.value} style={{ color: statusColors[o.value] }}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

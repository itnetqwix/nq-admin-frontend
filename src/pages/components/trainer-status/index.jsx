import { FormControl, MenuItem, Select } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { trainerStatusColors } from 'src/utils/utils'
import { updateTrainerStatus } from 'src/services/userAdminApi'

export default function TrainerStatus({ params, cb }) {
  const [status, setStatus] = useState(params.row.status)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setStatus(params.row.status)
  }, [params.row.status])

  const handleChange = async event => {
    const next = event.target.value
    const prev = status
    setStatus(next)
    setBusy(true)
    try {
      await updateTrainerStatus(params.row._id || params.row.id, next)
      cb?.()
    } catch (e) {
      setStatus(prev)
      toast.error(e?.message || 'Could not update status')
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormControl size='small' sx={{ minWidth: 118 }} onClick={e => e.stopPropagation()}>
      <Select
        size='small'
        value={status || 'pending'}
        onChange={e => void handleChange(e)}
        disabled={busy}
        sx={{
          height: 32,
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
          bgcolor: trainerStatusColors[status] || trainerStatusColors.pending,
          '& .MuiSelect-icon': { color: '#fff' },
          '& fieldset': { border: 'none' }
        }}
      >
        <MenuItem value='pending'>Pending</MenuItem>
        <MenuItem value='approved'>Approved</MenuItem>
        <MenuItem value='rejected'>Rejected</MenuItem>
      </Select>
    </FormControl>
  )
}

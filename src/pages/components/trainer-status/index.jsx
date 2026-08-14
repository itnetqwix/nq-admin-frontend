import { FormControl, MenuItem, Select } from '@mui/material'
import { useEffect, useState } from 'react'
import { trainerStatusColors } from 'src/utils/utils'
import { getApiBaseUrl } from 'src/utils/apiBase'
import authConfig from 'src/configs/auth'
import toast from 'react-hot-toast'

export default function TrainerStatus({ params, cb }) {
  const [status, setStatus] = useState(params.row.status)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setStatus(params.row.status)
  }, [params.row.status])

  const handleChange = event => {
    const next = event.target.value
    const prev = status
    setStatus(next)
    setBusy(true)
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const base = getApiBaseUrl()
    if (!storedToken || !base) {
      setStatus(prev)
      setBusy(false)
      return
    }
    fetch(`${base}/user/update-trainer-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      },
      body: JSON.stringify({ trainer_id: params.row._id || params.row.id, status: next })
    })
      .then(r => r.json())
      .then(response => {
        if (response.code === 400 || response.status === 'fail') {
          setStatus(prev)
          toast.error(response?.error || response?.message || 'Could not update status')
          return
        }
        cb?.()
      })
      .catch(() => {
        setStatus(prev)
        toast.error('Could not update status')
      })
      .finally(() => setBusy(false))
  }

  return (
    <FormControl size='small' sx={{ minWidth: 118 }} onClick={e => e.stopPropagation()}>
      <Select
        size='small'
        value={status || 'pending'}
        onChange={handleChange}
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


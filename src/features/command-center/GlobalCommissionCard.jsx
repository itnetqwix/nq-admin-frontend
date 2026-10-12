import { useContext, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { ops } from 'src/styles/opsSurface'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import Modal from 'src/pages/components/modal/Modal'
import CommissionForm from 'src/layouts/components/student/CommissionForm'
import { adminApi } from 'src/services/adminApi'

const KEY = ['global-commission']

/**
 * The platform-wide commission rate and its edit control, carried over from the old home page.
 * `CommissionForm` saves through its own API call and then calls `getGlobalCommission`, so that
 * callback refreshes the value and closes the dialog.
 */
export default function GlobalCommissionCard() {
  const ability = useContext(AbilityContext)
  const canEdit = ability?.can('update', 'admin-action-commission') ?? true
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: KEY,
    // The API returns a list of settings rows; the first holds the global rate.
    queryFn: async () => (await adminApi.get('/admin/get-global-commission'))?.[0] || null
  })

  const afterSave = async () => {
    await queryClient.invalidateQueries({ queryKey: KEY })
    setOpen(false)
  }

  return (
    <>
      <Box
        sx={{
          p: 2,
          height: '100%',
          bgcolor: ops.canvas,
          borderRadius: ops.radiusLg,
          boxShadow: ops.shadowCard,
          border: `1px solid ${ops.hairline}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Global commission
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
            Default rate for all trainers unless one has an override.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontFamily: ops.scoreboard, fontSize: 34, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {data?.commission ?? '—'}
            {data?.commission != null ? '%' : ''}
          </Typography>
          {canEdit ? (
            <Tooltip title='Edit global commission'>
              <IconButton size='small' onClick={() => setOpen(true)} aria-label='Edit global commission'>
                <Icon icon='tabler:edit' fontSize={18} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      </Box>
      <Modal handleClose={() => setOpen(false)} open={open} maxWidth='xs'>
        {canEdit ? <CommissionForm getGlobalCommission={afterSave} /> : null}
      </Modal>
    </>
  )
}

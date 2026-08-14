import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { PERM_GROUPS } from 'src/configs/adminRoleMatrix'
import { revokeUserSession } from 'src/services/user360Api'

export default function RoleDialogs({
  inviteOpen, setInviteOpen, inviteEmail, setInviteEmail, inviteName, setInviteName,
  inviteRoles, inviteRole, setInviteRole, inviting, onInvite,
  createOpen, setCreateOpen, newRoleName, setNewRoleName, newRoleLabel, setNewRoleLabel,
  newRolePerms, setNewRolePerms, savingRole, saveCreateRole,
  editTemplateOpen, setEditTemplateOpen, saveEditTemplate, focusRole,
  overrideUser, setOverrideUser, draftPerms, setDraftPerms, saveOverride, savingOverride,
  devicesUser, setDevicesUser, revokingSessionId, setRevokingSessionId
}) {
  return (
    <>
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Invite sub-admin</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2, fontSize: 13, color: ops.mute }}>
            We’ll email a set-password link. They can sign in without MFA — only the main SuperAdmin
            must use an authenticator.
          </Typography>
          <Stack spacing={2}>
            <TextField
              autoFocus
              size='small'
              type='email'
              label='Email'
              placeholder='name@company.com'
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
            <TextField
              size='small'
              label='Name (optional)'
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
            />
            <TextField
              select
              size='small'
              label='Role'
              value={inviteRoles.includes(inviteRole) ? inviteRole : inviteRoles[0] || 'Admin'}
              onChange={e => setInviteRole(e.target.value)}
            >
              {inviteRoles.map(r => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={inviting}
            onClick={() => void onInvite()}
            sx={{ textTransform: 'none', bgcolor: ops.ink }}
          >
            {inviting ? 'Sending…' : 'Send invite'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Create custom role</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 480 }}>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <TextField
              size='small'
              label='Role name (PascalCase)'
              placeholder='FinanceOps'
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              helperText='Letters, numbers, underscore — not a built-in name'
            />
            <TextField
              size='small'
              label='Display label'
              value={newRoleLabel}
              onChange={e => setNewRoleLabel(e.target.value)}
            />
          </Stack>
          {PERM_GROUPS.map(group => (
            <Box key={group.title} sx={{ mb: 2 }}>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 1, textTransform: 'uppercase' }}>
                {group.title}
              </Typography>
              <Stack spacing={0.25}>
                {group.keys.map(key => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        size='small'
                        checked={newRolePerms[key] === true}
                        onChange={e => setNewRolePerms(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                    }
                    label={<Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{key}</Typography>}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={savingRole || !newRoleName.trim()}
            onClick={() => void saveCreateRole()}
            sx={{ textTransform: 'none', bgcolor: ops.ink }}
          >
            Create role
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editTemplateOpen} onClose={() => setEditTemplateOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Edit template · {focusRole}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 480 }}>
          <Typography sx={{ mb: 2, fontSize: 13, color: ops.mute }}>
            Saving pushes this permission set to every admin currently assigned this role.
          </Typography>
          {PERM_GROUPS.map(group => (
            <Box key={group.title} sx={{ mb: 2 }}>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 1, textTransform: 'uppercase' }}>
                {group.title}
              </Typography>
              <Stack spacing={0.25}>
                {group.keys.map(key => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        size='small'
                        checked={newRolePerms[key] === true}
                        onChange={e => setNewRolePerms(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                    }
                    label={<Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{key}</Typography>}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTemplateOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={savingRole}
            onClick={() => void saveEditTemplate()}
            sx={{ textTransform: 'none', bgcolor: ops.ink }}
          >
            Save template
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(overrideUser)} onClose={() => setOverrideUser(null)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ fontFamily: ops.sans }}>
          Edit permissions · {overrideUser?.fullname || overrideUser?.email}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 480 }}>
          <Typography sx={{ mb: 2, fontSize: 13, color: ops.mute }}>
            Role: {overrideUser?.admin_role}. Toggles write explicit overrides (deny-by-default for off).
          </Typography>
          {PERM_GROUPS.map(group => (
            <Box key={group.title} sx={{ mb: 2 }}>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 1, textTransform: 'uppercase' }}>
                {group.title}
              </Typography>
              <Stack spacing={0.25}>
                {group.keys.map(key => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        size='small'
                        checked={draftPerms[key] === true}
                        onChange={e => setDraftPerms(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                    }
                    label={<Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{key}</Typography>}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideUser(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={savingOverride}
            onClick={() => void saveOverride()}
            sx={{ textTransform: 'none', bgcolor: ops.ink }}
          >
            Save overrides
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(devicesUser)} onClose={() => setDevicesUser(null)} maxWidth='sm' fullWidth>
        <DialogTitle>
          Devices · {devicesUser?.fullname || devicesUser?.email}
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2, fontSize: 13, color: ops.mute }}>
            Auth sessions for this admin — device, IP, location, last used. Revoke kicks that device off immediately.
          </Typography>
          {(devicesUser?.sessions || []).length ? (
            <Stack spacing={1.5}>
              {(devicesUser.sessions || []).map(s => (
                <Box
                  key={s.id}
                  sx={{
                    borderBottom: `1px solid ${ops.hairline}`,
                    pb: 1.25
                  }}
                >
                  <Stack direction='row' justifyContent='space-between' gap={1} flexWrap='wrap' alignItems='flex-start'>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {s.deviceLabel || 'Device'} · {s.platform || '—'}
                        {s.revokedAt ? ' · revoked' : s.trusted ? ' · trusted' : ''}
                      </Typography>
                      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                        {[
                          s.ipAddress || 'no ip',
                          s.loginMethod,
                          [s.city, s.region, s.country].filter(Boolean).join(', '),
                          s.browser,
                          s.os,
                          s.appVersion
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                      <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
                        {[s.publicId, s.clientType, s.timezone].filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                    <Stack alignItems='flex-end' spacing={0.5}>
                      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.body }}>
                        {s.lastUsedAt ? formatOpsDateTime(s.lastUsedAt, { withSeconds: false }) : '—'}
                      </Typography>
                      {!s.revokedAt && devicesUser?.id ? (
                        <Button
                          size='small'
                          color='error'
                          disabled={revokingSessionId === s.id}
                          sx={{ textTransform: 'none', minWidth: 0 }}
                          onClick={async () => {
                            setRevokingSessionId(s.id)
                            try {
                              await revokeUserSession(devicesUser.id, s.id)
                              toast.success('Session revoked')
                              setDevicesUser(prev =>
                                prev
                                  ? {
                                      ...prev,
                                      sessions: (prev.sessions || []).map(row =>
                                        row.id === s.id ? { ...row, revokedAt: new Date().toISOString() } : row
                                      )
                                    }
                                  : prev
                              )
                              void load()
                            } catch (e) {
                              toast.error(e?.message || 'Revoke failed')
                            } finally {
                              setRevokingSessionId(null)
                            }
                          }}
                        >
                          {revokingSessionId === s.id ? '…' : 'Revoke'}
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 13, color: ops.mute }}>No sessions on record.</Typography>
          )}
          {devicesUser?.id ? (
            <Button
              component={Link}
              href={`/apps/logs?tab=login&userId=${devicesUser.id}`}
              size='small'
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Full login history →
            </Button>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDevicesUser(null)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </>
  )
}

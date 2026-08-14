import { Fragment } from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { ops } from 'src/styles/opsSurface'
import { PERM_GROUPS } from 'src/configs/adminRoleMatrix'

export default function PermissionMatrix({ focusRole, roleList, cellTone, matrixSource }) {
  return (
      <AdminPageSection
        title='Permission matrix'
        subtitle={`Focus: ${focusRole}. SuperAdmin = unrestricted. Missing keys deny for all other roles.`}
      >
        <OpsSurfaceCard sx={{ p: 0, overflow: 'auto', maxHeight: 560 }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: ops.canvasSoft, minWidth: 220 }}>
                  Permission
                </TableCell>
                {roleList.map(r => (
                  <TableCell
                    key={r}
                    align='center'
                    sx={{
                      fontFamily: ops.mono,
                      fontSize: 11,
                      bgcolor: focusRole === r ? ops.canvasSoft2 : ops.canvasSoft,
                      fontWeight: focusRole === r ? 700 : 400
                    }}
                  >
                    {r}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {PERM_GROUPS.map(group => (
                <Fragment key={group.title}>
                  <TableRow>
                    <TableCell
                      colSpan={roleList.length + 1}
                      sx={{
                        bgcolor: ops.night,
                        color: ops.onNight,
                        fontFamily: ops.mono,
                        fontSize: 11,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase'
                      }}
                    >
                      {group.title}
                    </TableCell>
                  </TableRow>
                  {group.keys.map(key => (
                    <TableRow key={key} hover>
                      <TableCell sx={{ fontFamily: ops.mono, fontSize: 12 }}>{key}</TableCell>
                      {roleList.map(r => {
                        const tone = cellTone(r, key, matrixSource)
                        return (
                          <TableCell key={`${r}-${key}`} align='center'>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: tone.bg,
                                color: tone.color,
                                fontFamily: ops.mono,
                                fontSize: 11,
                                fontWeight: 600,
                                minWidth: 36,
                                justifyContent: 'center'
                              }}
                            >
                              {tone.label}
                            </Box>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </OpsSurfaceCard>
      </AdminPageSection>

  )
}

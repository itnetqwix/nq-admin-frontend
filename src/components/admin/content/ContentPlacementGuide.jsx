import React from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import NextLink from 'next/link'
import {
  BANNERS_PLACEMENT,
  TIPS_PLACEMENT
} from './contentPlacementConfig'

/**
 * @param {{ kind: 'tips' | 'banners' }} props
 */
export default function ContentPlacementGuide({ kind }) {
  const rows = kind === 'tips' ? TIPS_PLACEMENT : BANNERS_PLACEMENT
  const otherHref = kind === 'tips' ? '/apps/banners' : '/apps/tips'
  const otherLabel = kind === 'tips' ? 'Banners' : 'Tips'

  return (
    <Accordion
      defaultExpanded
      disableGutters
      elevation={0}
      sx={{
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        '&:before': { display: 'none' }
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography fontWeight={700}>Where this appears in the app</Typography>
          <Typography variant='caption' color='text.secondary'>
            Match audience tags to the screens below.{' '}
            <Link component={NextLink} href={otherHref} underline='hover'>
              Manage {otherLabel}
            </Link>
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Alert severity='info' sx={{ mb: 2 }}>
          Mobile app is live today. Web dashboard uses the same API but UI is not wired yet — plan
          audience tags the same way.
        </Alert>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Surface</TableCell>
              {kind === 'banners' ? <TableCell>Placement key</TableCell> : null}
              <TableCell>Path</TableCell>
              <TableCell>Audience tags</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.surface}>
                <TableCell>
                  <Typography variant='body2' fontWeight={600}>
                    {row.surface}
                  </Typography>
                </TableCell>
                {kind === 'banners' && row.placement ? (
                  <TableCell>
                    <Chip label={row.placement} size='small' variant='outlined' />
                  </TableCell>
                ) : kind === 'banners' ? (
                  <TableCell>—</TableCell>
                ) : null}
                <TableCell>
                  <Typography variant='body2' color='text.secondary'>
                    {row.path}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {row.audiences.map(a => (
                      <Chip key={a} label={a} size='small' variant='outlined' />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant='caption' color='text.secondary'>
                    {row.notes}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  )
}

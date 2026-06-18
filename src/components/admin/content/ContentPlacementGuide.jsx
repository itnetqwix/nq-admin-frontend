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
  BLOG_PLACEMENT,
  LEGAL_PLACEMENT,
  TIPS_PLACEMENT
} from './contentPlacementConfig'

const CONFIG = {
  tips: { rows: TIPS_PLACEMENT, otherHref: '/apps/banners', otherLabel: 'Banners', showPlacementKey: false },
  banners: { rows: BANNERS_PLACEMENT, otherHref: '/apps/tips', otherLabel: 'Tips', showPlacementKey: true },
  blog: { rows: BLOG_PLACEMENT, otherHref: '/apps/cms-legal', otherLabel: 'Legal', showPlacementKey: true },
  legal: { rows: LEGAL_PLACEMENT, otherHref: '/apps/cms-blog', otherLabel: 'Blog & pages', showPlacementKey: false }
}

/**
 * @param {{ kind: 'tips' | 'banners' | 'blog' | 'legal' }} props
 */
export default function ContentPlacementGuide({ kind }) {
  const cfg = CONFIG[kind] || CONFIG.banners
  const rows = cfg.rows

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
            <Link component={NextLink} href={cfg.otherHref} underline='hover'>
              Manage {cfg.otherLabel}
            </Link>
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Alert severity='info' sx={{ mb: 2 }}>
          Use the mobile preview panel while editing — it matches real component sizes (390pt frame).
          Changes publish instantly via CMS_UPDATED socket.
        </Alert>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Surface</TableCell>
              {cfg.showPlacementKey ? <TableCell>Key</TableCell> : null}
              <TableCell>Path</TableCell>
              <TableCell>Image spec</TableCell>
              <TableCell>Audience</TableCell>
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
                {cfg.showPlacementKey ? (
                  <TableCell>
                    {row.placement || row.previewKey ? (
                      <Chip label={row.placement || row.previewKey} size='small' variant='outlined' />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                ) : null}
                <TableCell>
                  <Typography variant='body2' color='text.secondary'>
                    {row.path}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='caption' color='text.secondary'>
                    {row.imageSpec?.label || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(row.audiences || []).map(a => (
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

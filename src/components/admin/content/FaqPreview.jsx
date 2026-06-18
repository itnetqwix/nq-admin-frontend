import React, { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { useMobilePreviewFrame } from './MobilePreviewFrameContext'

/**
 * Mobile FAQ accordion preview — Settings → FAQ in the app.
 */
export default function FaqPreview({ sections = [] }) {
  const frame = useMobilePreviewFrame()
  const [expanded, setExpanded] = useState(null)

  const visible = sections
    .map(sec => ({
      title: String(sec.title || '').trim(),
      items: (sec.items || [])
        .map(it => ({
          q: String(it.q || it.question || '').trim(),
          a: String(it.a || it.answer || '').trim()
        }))
        .filter(it => it.q && it.a)
    }))
    .filter(sec => sec.title && sec.items.length)

  return (
    <Box sx={{ px: `${frame.contentPadding}px`, py: 1.5, bgcolor: '#f4f6f9', minHeight: 320 }}>
      <Typography variant='caption' color='text.secondary' fontWeight={700} sx={{ mb: 1, display: 'block' }}>
        Settings → FAQ
      </Typography>
      {!visible.length ? (
        <Typography variant='body2' color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
          Add a section with at least one Q&amp;A to preview.
        </Typography>
      ) : (
        visible.map((sec, si) => (
          <Box key={sec.title + si} sx={{ mb: 2 }}>
            <Typography
              fontWeight={800}
              fontSize={13}
              color='#000080'
              sx={{ mb: 0.75, textTransform: 'uppercase', letterSpacing: 0.4 }}
            >
              {sec.title}
            </Typography>
            {sec.items.map((it, ii) => {
              const key = `${si}-${ii}`
              return (
                <Accordion
                  key={key}
                  disableGutters
                  elevation={0}
                  expanded={expanded === key}
                  onChange={() => setExpanded(expanded === key ? null : key)}
                  sx={{
                    mb: 0.75,
                    borderRadius: '8px !important',
                    border: '1px solid #d8dce3',
                    bgcolor: '#fff',
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}>
                    <Typography fontWeight={600} fontSize={14}>
                      {it.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Typography variant='body2' color='text.secondary' fontSize={13} sx={{ whiteSpace: 'pre-wrap' }}>
                      {it.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </Box>
        ))
      )}
    </Box>
  )
}

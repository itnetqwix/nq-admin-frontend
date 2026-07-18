import React from 'react'
import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { ops } from 'src/styles/opsSurface'

/**
 * Full-height Ops Surface editor shell — night-adjacent header, ink save CTA.
 */
export default function CmsEditorDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  onSave,
  saveLabel = 'Save',
  saving = false,
  saveDisabled = false,
  secondaryAction,
  width = { xs: '100%', sm: '96vw', md: 1200 }
}) {
  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width,
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: ops.shadowDrawer
        }
      }}
    >
      <Stack
        direction='row'
        alignItems='flex-start'
        justifyContent='space-between'
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${ops.hairline}`,
          bgcolor: ops.canvas
        }}
      >
        <Box sx={{ pr: 2, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 18 }} noWrap>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ fontSize: 13, color: ops.body, mt: 0.25, lineHeight: 1.45 }}>{subtitle}</Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose} aria-label='Close editor' edge='end' sx={{ color: ops.mute }}>
          <CloseIcon />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 2.5 }, bgcolor: ops.canvasSoft }}>{children}</Box>

      <Divider sx={{ borderColor: ops.hairline }} />
      <Stack
        direction='row'
        spacing={1}
        justifyContent='flex-end'
        alignItems='center'
        sx={{ px: 2.5, py: 2, bgcolor: ops.canvas }}
      >
        {secondaryAction}
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        {onSave ? (
          <Button
            variant='contained'
            onClick={onSave}
            disabled={saving || saveDisabled}
            sx={{ textTransform: 'none', bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
          >
            {saving ? 'Saving…' : saveLabel}
          </Button>
        ) : null}
      </Stack>
    </Drawer>
  )
}

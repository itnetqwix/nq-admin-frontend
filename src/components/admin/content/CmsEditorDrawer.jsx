import React from 'react'
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

/**
 * Full-height editor shell — replaces cramped Dialog modals for CMS CRUD.
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
          flexDirection: 'column'
        }
      }}
    >
      <Stack
        direction='row'
        alignItems='flex-start'
        justifyContent='space-between'
        sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Box sx={{ pr: 2, minWidth: 0 }}>
          <Typography variant='h6' fontWeight={700} noWrap>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose} aria-label='Close editor' edge='end'>
          <CloseIcon />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 2.5 } }}>{children}</Box>

      <Divider />
      <Stack
        direction='row'
        spacing={1}
        justifyContent='flex-end'
        alignItems='center'
        sx={{ px: 2.5, py: 2, bgcolor: 'grey.50' }}
      >
        {secondaryAction}
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        {onSave ? (
          <Button variant='contained' onClick={onSave} disabled={saving || saveDisabled}>
            {saving ? 'Saving…' : saveLabel}
          </Button>
        ) : null}
      </Stack>
    </Drawer>
  )
}

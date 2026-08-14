import React from 'react'
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel,
  Grid, IconButton, InputLabel, ListItemText, MenuItem, Select, Stack, Switch, TextField, Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CmsEditorDrawer from 'src/components/admin/content/CmsEditorDrawer'
import BannerCtaEditor from 'src/components/admin/content/BannerCtaEditor'
import BannerPlacementPreview from 'src/components/admin/content/BannerPlacementPreview'
import CmsImageUploader from 'src/components/admin/content/CmsImageUploader'
import MobileFramePreview from 'src/components/admin/content/MobileFramePreview'
import PreviewAudienceToggle, { bannerVisibleForAudience } from 'src/components/admin/content/PreviewAudienceToggle'
import { BANNERS_AUDIENCE_HELP, BANNERS_PLACEMENT_HELP } from 'src/components/admin/content/contentPlacementConfig'
import { AUDIENCES, PLACEMENTS, SEVERITIES } from './helpers'

export default function BannerEditor(p) {
  const {
    formOpen, setFormOpen, editId, form, handleSave, saving, handleFormChange,
    previewRow, setPreviewRow, previewAudience, setPreviewAudience, openEdit
  } = p
  return (
    <>
      <CmsEditorDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'Edit banner' : 'Create banner'}
        subtitle={PLACEMENTS.find(p => p.value === form.placement)?.label || form.placement}
        onSave={handleSave}
        saving={saving}
        saveLabel={editId ? 'Update' : 'Create'}
      >
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label='Title'
                fullWidth
                size='small'
                value={form.title}
                onChange={e => handleFormChange('title', e.target.value)}
                inputProps={{ maxLength: 120 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Placement</InputLabel>
                <Select
                  label='Placement'
                  value={form.placement}
                  onChange={e => handleFormChange('placement', e.target.value)}
                >
                  {PLACEMENTS.map(p => (
                    <MenuItem key={p.value} value={p.value}>
                      <ListItemText
                        primary={p.label}
                        secondary={BANNERS_PLACEMENT_HELP[p.value] || p.hint}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Severity</InputLabel>
                <Select
                  label='Severity'
                  value={form.severity}
                  onChange={e => handleFormChange('severity', e.target.value)}
                >
                  {SEVERITIES.map(s => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Body (optional)'
                fullWidth
                size='small'
                multiline
                minRows={2}
                value={form.body}
                onChange={e => handleFormChange('body', e.target.value)}
                inputProps={{ maxLength: 600 }}
                helperText={`${form.body.length}/600`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Audience</InputLabel>
                <Select
                  label='Audience'
                  multiple
                  value={form.audience}
                  onChange={e => handleFormChange('audience', e.target.value)}
                  renderValue={v => v.join(', ')}
                >
                  {AUDIENCES.map(a => (
                    <MenuItem key={a} value={a}>
                      <Switch size='small' checked={form.audience.indexOf(a) > -1} />
                      <ListItemText
                        primary={a}
                        secondary={BANNERS_AUDIENCE_HELP[a]}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {form.placement === 'hero' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Auto-advance (seconds)'
                  fullWidth
                  size='small'
                  type='number'
                  inputProps={{ min: 3, max: 60 }}
                  value={form.auto_advance_sec}
                  onChange={e => handleFormChange('auto_advance_sec', e.target.value)}
                  helperText='Hero carousel slide interval (3–60)'
                />
              </Grid>
            ) : null}
            <Grid item xs={12}>
              <CmsImageUploader
                kind='banners'
                surfaceKey={`banner.${form.placement || 'hero'}`}
                label='Foreground image'
                value={form.image_url}
                onChange={v => handleFormChange('image_url', v)}
              />
            </Grid>
            <Grid item xs={12}>
              <CmsImageUploader
                kind='banners'
                surfaceKey={`banner.${form.placement || 'hero'}.background`}
                label='Background image (optional)'
                value={form.background_image_url}
                onChange={v => handleFormChange('background_image_url', v)}
                helperText='Full-bleed behind text — great for hero promos'
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='Background color'
                fullWidth
                size='small'
                value={form.background_color}
                onChange={e => handleFormChange('background_color', e.target.value)}
                placeholder='#1a237e or transparent'
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='Image height (px)'
                fullWidth
                size='small'
                type='number'
                inputProps={{ min: 64, max: 320 }}
                value={form.image_height}
                onChange={e => handleFormChange('image_height', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='Overlay opacity'
                fullWidth
                size='small'
                type='number'
                inputProps={{ min: 0, max: 1, step: 0.05 }}
                value={form.overlay_opacity}
                onChange={e => handleFormChange('overlay_opacity', e.target.value)}
                helperText='Darken background image for readable text'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Image fit</InputLabel>
                <Select
                  label='Image fit'
                  value={form.image_fit}
                  onChange={e => handleFormChange('image_fit', e.target.value)}
                >
                  <MenuItem value='cover'>Cover (crop to fill)</MenuItem>
                  <MenuItem value='contain'>Contain (fit inside)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Text align</InputLabel>
                <Select
                  label='Text align'
                  value={form.text_align}
                  onChange={e => handleFormChange('text_align', e.target.value)}
                >
                  <MenuItem value='left'>Left</MenuItem>
                  <MenuItem value='center'>Center</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <BannerCtaEditor
                ctas={form.ctas}
                onChange={next => handleFormChange('ctas', next)}
              />
            </Grid>
            {!(form.ctas || []).length ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label='CTA label (legacy, optional)'
                    fullWidth
                    size='small'
                    value={form.cta_label}
                    onChange={e => handleFormChange('cta_label', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label='CTA URL / deep link (legacy)'
                    fullWidth
                    size='small'
                    value={form.cta_url}
                    onChange={e => handleFormChange('cta_url', e.target.value)}
                    placeholder='netqwix://wallet or https://…'
                  />
                </Grid>
              </>
            ) : null}
            <Grid item xs={12} sm={4}>
              <TextField
                label='Start date (optional)'
                fullWidth
                size='small'
                type='date'
                InputLabelProps={{ shrink: true }}
                value={form.start_date}
                onChange={e => handleFormChange('start_date', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='End date (optional)'
                fullWidth
                size='small'
                type='date'
                InputLabelProps={{ shrink: true }}
                value={form.end_date}
                onChange={e => handleFormChange('end_date', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='Sort order'
                fullWidth
                size='small'
                type='number'
                value={form.sort_order}
                onChange={e => handleFormChange('sort_order', e.target.value)}
                helperText='Lower numbers appear first'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.dismissible}
                    onChange={e => handleFormChange('dismissible', e.target.checked)}
                  />
                }
                label='User can dismiss locally'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={e => handleFormChange('is_active', e.target.checked)}
                  />
                }
                label='Active'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='A/B experiment key'
                fullWidth
                size='small'
                value={form.experiment_key}
                onChange={e => handleFormChange('experiment_key', e.target.value)}
                placeholder='e.g. spring-hero-test'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Variant label'
                fullWidth
                size='small'
                value={form.variant_label}
                onChange={e => handleFormChange('variant_label', e.target.value)}
                placeholder='A, B, control…'
              />
            </Grid>
              </Grid>
            </Grid>
            <Grid
              item
              xs={12}
              md={5}
              sx={{
                position: { md: 'sticky' },
                top: { md: 8 },
                alignSelf: 'flex-start'
              }}
            >
              <Stack direction='row' alignItems='center' flexWrap='wrap' useFlexGap sx={{ mb: 1 }}>
                <PreviewAudienceToggle value={previewAudience} onChange={setPreviewAudience} />
              </Stack>
              <MobileFramePreview
                label='App preview'
                subtitle={PLACEMENTS.find(p => p.value === form.placement)?.label}
              >
                <BannerPlacementPreview
                  form={form}
                  showLabel={false}
                  embedded
                  previewAudience={previewAudience}
                />
              </MobileFramePreview>
              <Box sx={{ mt: 2 }}>
                <BannerPlacementPreview form={form} compareAll showLabel={false} previewAudience={previewAudience} />
              </Box>
            </Grid>
          </Grid>
      </CmsEditorDrawer>

      <Dialog open={!!previewRow} onClose={() => setPreviewRow(null)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {previewRow
            ? `Preview · ${PLACEMENTS.find(p => p.value === (previewRow.placement || 'hero'))?.label || previewRow.placement}`
            : 'Banner preview'}
        </DialogTitle>
        <DialogContent>
          {previewRow ? (
            <MobileFramePreview showLabel={false} footer={false}>
              <BannerPlacementPreview form={previewRow} showLabel={false} embedded />
            </MobileFramePreview>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewRow(null)}>Close</Button>
          {previewRow ? (
            <Button
              variant='contained'
              onClick={() => {
                openEdit(previewRow)
                setPreviewRow(null)
              }}
              sx={{ bgcolor: '#000080' }}
            >
              Edit
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </>
  )
}

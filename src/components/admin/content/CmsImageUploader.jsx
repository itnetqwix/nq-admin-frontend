import React, { useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import toast from 'react-hot-toast'

import { presignCmsAsset } from 'src/services/cmsAssetApi'
import { putPresigned } from 'src/utils/presignedUpload'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'
import { getImageSpec } from './contentPlacementConfig'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp'

/**
 * Upload CMS images to S3 with placement-aware preview frame + recommended dimensions.
 */
export default function CmsImageUploader({
  label = 'Image',
  kind = 'banners',
  surfaceKey,
  value = '',
  onChange,
  helperText
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const spec = surfaceKey ? getImageSpec(surfaceKey) : null
  const previewUrl = resolveCmsImageUrl(value)
  const usesImage = spec ? spec.usesImage !== false : true

  const handleFile = async file => {
    if (!file) return
    if (!ACCEPT.split(',').includes(file.type)) {
      toast.error('Use JPEG, PNG, or WebP')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 5 MB or smaller')
      return
    }

    setUploading(true)
    try {
      const presign = await presignCmsAsset({
        kind,
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size
      })
      await putPresigned(presign.uploadUrl, file, file.type)
      onChange(presign.key)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const previewSx = spec?.aspectRatio
    ? {
        width: '100%',
        maxWidth: spec.previewSize ? spec.previewSize * 2 : 360,
        aspectRatio: String(spec.aspectRatio),
        objectFit: 'cover',
        borderRadius: 1,
        border: '2px solid',
        borderColor: 'primary.main'
      }
    : {
        width: '100%',
        maxWidth: spec?.previewSize ? spec.previewSize * 2 : 320,
        maxHeight: spec?.previewHeight || 140,
        objectFit: 'cover',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }

  const defaultHelper =
    spec?.label ||
    helperText ||
    'Upload above or paste a URL / existing S3 key'

  return (
    <Box>
      <Typography variant='subtitle2' gutterBottom>
        {label}
      </Typography>
      {spec && spec.usesImage === false ? (
        <Alert severity='info' sx={{ mb: 1 }}>
          {spec.label} — you can still upload for records, but the mobile app will not show this image
          on this placement.
        </Alert>
      ) : spec?.label ? (
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
          Recommended: {spec.label}
          {spec.width && spec.height ? ` (${spec.width}×${spec.height}px)` : ''}
        </Typography>
      ) : null}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
        <Button
          variant='outlined'
          size='small'
          startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadOutlinedIcon />}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Upload image'}
        </Button>
        {value ? (
          <Button size='small' color='inherit' onClick={() => onChange('')} disabled={uploading}>
            Remove
          </Button>
        ) : null}
        <input
          ref={inputRef}
          type='file'
          accept={ACCEPT}
          hidden
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </Box>
      {previewUrl && usesImage ? (
        <Box sx={{ mb: 1, position: 'relative' }}>
          <Box component='img' src={previewUrl} alt='' sx={previewSx} />
          {spec?.aspectRatio ? (
            <Typography variant='caption' color='primary' sx={{ mt: 0.5, display: 'block' }}>
              Preview frame matches mobile aspect ratio
            </Typography>
          ) : null}
        </Box>
      ) : null}
      <TextField
        label='Image URL or S3 key (optional)'
        fullWidth
        size='small'
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder='https://… or cms/banners/…'
        helperText={helperText || defaultHelper}
      />
    </Box>
  )
}

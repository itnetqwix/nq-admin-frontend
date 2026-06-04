import React, { useRef, useState } from 'react'
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import toast from 'react-hot-toast'

import { presignCmsAsset } from 'src/services/cmsAssetApi'
import { putPresigned } from 'src/utils/presignedUpload'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp'

/**
 * Upload CMS images to S3 (banners, tips, pages) with optional manual URL fallback.
 */
export default function CmsImageUploader({
  label = 'Image',
  kind = 'banners',
  value = '',
  onChange,
  helperText
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const previewUrl = resolveCmsImageUrl(value)

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

  return (
    <Box>
      <Typography variant='subtitle2' gutterBottom>
        {label}
      </Typography>
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
      {previewUrl ? (
        <Box
          component='img'
          src={previewUrl}
          alt=''
          sx={{
            width: '100%',
            maxWidth: 320,
            maxHeight: 140,
            objectFit: 'cover',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            mb: 1
          }}
        />
      ) : null}
      <TextField
        label='Image URL or S3 key (optional)'
        fullWidth
        size='small'
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder='https://… or cms/banners/…'
        helperText={helperText || 'Upload above or paste a URL / existing S3 key'}
      />
    </Box>
  )
}

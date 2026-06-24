import React, { useCallback, useRef, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Slider, Stack, TextField, Typography } from '@mui/material'
import Cropper from 'react-easy-crop'
import toast from 'react-hot-toast'

import { presignCmsAsset } from 'src/services/cmsAssetApi'
import { putPresigned } from 'src/utils/presignedUpload'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'

async function getCroppedBlob(imageSrc, pixelCrop) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92)
  })
}

/** Blog cover with optional 16:9 crop before upload. */
export default function CmsCoverCropUploader({ label = 'Cover image', value, onChange, kind = 'pages' }) {
  const inputRef = useRef(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [rawFile, setRawFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [uploading, setUploading] = useState(false)

  const preview = resolveCmsImageUrl(value)

  const onCropComplete = useCallback((_a, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const uploadBlob = async (blob, name) => {
    const file = new File([blob], name, { type: 'image/jpeg' })
    const presign = await presignCmsAsset({
      kind,
      fileName: file.name,
      contentType: file.type,
      fileSizeBytes: file.size
    })
    await putPresigned(presign.uploadUrl, file, file.type)
    onChange(presign.key)
    toast.success('Cover uploaded')
  }

  const handleFile = file => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setRawFile(file)
    setPreviewUrl(url)
    setCropOpen(true)
  }

  const applyCrop = async () => {
    if (!previewUrl || !croppedAreaPixels || !rawFile) return
    setUploading(true)
    try {
      const blob = await getCroppedBlob(previewUrl, croppedAreaPixels)
      await uploadBlob(blob, rawFile.name.replace(/\.\w+$/, '.jpg'))
      setCropOpen(false)
    } catch (e) {
      toast.error(e?.message || 'Crop upload failed')
    } finally {
      setUploading(false)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setRawFile(null)
    }
  }

  const uploadDirect = async file => {
    setUploading(true)
    try {
      await uploadBlob(file, file.name)
    } catch (e) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Box>
      <Typography variant='subtitle2' sx={{ mb: 1 }}>
        {label}
      </Typography>
      {preview ? (
        <Box
          component='img'
          src={preview}
          alt=''
          sx={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 1, mb: 1 }}
        />
      ) : null}
      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1 }}>
        <Button variant='outlined' size='small' disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading…' : 'Upload cover'}
        </Button>
        <Button variant='outlined' size='small' disabled={uploading} onClick={() => inputRef.current?.click()}>
          Crop 16:9 & upload
        </Button>
      </Stack>
      <input
        ref={inputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp'
        hidden
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <TextField
        fullWidth
        size='small'
        label='Or paste image URL / S3 key'
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        sx={{ mt: 1 }}
      />
      <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.5 }}>
        16:9 crop recommended for blog cards in the app home feed.
      </Typography>

      <Dialog open={cropOpen} onClose={() => !uploading && setCropOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Crop cover (16:9)</DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', height: 280, bgcolor: '#111' }}>
            {previewUrl ? (
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : null}
          </Box>
          <Slider sx={{ mt: 2 }} min={1} max={3} step={0.05} value={zoom} onChange={(_e, v) => setZoom(v)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCropOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button variant='contained' onClick={() => void applyCrop()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Apply & upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
